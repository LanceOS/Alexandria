import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { CODE_RUNNER_LIMITS } from '../../shared/code-runner.js';
import { AppError } from '../http/errors.js';
import { createCodeRunner } from './code-runner.js';

const enabled = process.env.ALEXANDRIA_RUNNER_INTEGRATION === '1';
const errorStatus = (status: number) => (error: unknown) => error instanceof AppError && error.statusCode === status;

test('real rootless C++ runner enforces isolation, limits, lifecycle and fairness', { skip: !enabled, timeout: 60_000 }, async (t) => {
  const runner = createCodeRunner({ image: process.env.CODE_RUNNER_IMAGE });
  t.after(() => runner.close());
  const status = await runner.status();
  assert.equal(status.available, true, 'Run npm run runner:setup on a host with rootless Podman, cgroups v2 and seccomp.');
  const names = () => execFileSync('podman', ['--remote=false', 'ps', '--all', '--filter=label=io.alexandria.runner=1', '--format={{.Names}}'], { encoding: 'utf8' }).trim();
  assert.equal(names(), '', 'Verification requires an idle runner.');
  const run = (source: string, stdin = '') => runner.run(randomUUID(), { language: 'cpp', source, stdin });

  await t.test('C++20, threads, stdin and independent diagnostic streams work', async () => {
    const result = await run('#include <iostream>\n#include <thread>\n#include <string>\nint main(){std::string name;std::getline(std::cin,name);std::jthread worker([&]{std::cout << "Hello, " << name << "!\\n";std::cerr << "diagnostic\\n";});}', 'Alexandria');
    assert.equal(result.status, 'success', JSON.stringify(result));
    assert.equal(result.stdout, 'Hello, Alexandria!\n');
    assert.equal(result.stderr, 'diagnostic\n');
    assert.equal(result.exitCode, 0);
    assert.equal(names(), '');
  });

  await t.test('compiler failures and learner text cannot spoof outer execution results', async () => {
    const invalid = await run('int main() { this is not C++; }');
    assert.equal(invalid.status, 'compile_error');
    assert.match(invalid.compileOutput, /error:/);
    assert.equal(invalid.stdout, '');
    const result = await run('#include <iostream>\nint main(){std::cout << R"({"status":"success","exitCode":0})";return 7;}');
    assert.equal(result.status, 'runtime_error');
    assert.equal(result.exitCode, 7);
    assert.equal(result.stdout, '{"status":"success","exitCode":0}');
    assert.equal(names(), '');
  });

  await t.test('runtime and compiler output have one bounded byte budget', async () => {
    const runtime = await run('#warning Learning example\n#include <unistd.h>\nint main(){char data[4096]={};while(true)write(1,data,sizeof(data));}');
    assert.equal(runtime.status, 'output_limit', JSON.stringify(runtime));
    assert.ok(runtime.compileOutput.length > 0);
    assert.ok(Buffer.byteLength(runtime.stdout + runtime.stderr + runtime.compileOutput) <= CODE_RUNNER_LIMITS.outputBytes);
    const compiler = await run(`#warning ${'a'.repeat(30_000)}\nint main(){}`);
    assert.equal(compiler.status, 'output_limit');
    assert.ok(Buffer.byteLength(compiler.compileOutput) <= CODE_RUNNER_LIMITS.outputBytes);
    assert.equal(names(), '');
  });

  await t.test('infinite loops and excessive allocation end inside the sandbox', async () => {
    const loop = await run('int main(){for(;;){}}');
    assert.equal(loop.status, 'time_limit', JSON.stringify(loop));
    assert.ok(loop.durationMs < 10_000);
    const memory = await run('#include <cstdlib>\n#include <cstring>\nint main(){for(;;){void* p=std::malloc(16*1024*1024);if(!p)return 42;std::memset(p,1,16*1024*1024);}}');
    assert.equal(memory.status, 'runtime_error', JSON.stringify(memory));
    assert.notEqual(memory.exitCode, 0);
    assert.equal(names(), '');
  });

  await t.test('host files, host environment, outbound networking and image writes are unavailable', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'alexandria-runner-isolation-'));
    const sentinel = join(directory, 'host-only.txt');
    await writeFile(sentinel, 'This file must never enter the container.');
    process.env.ALEXANDRIA_RUNNER_TEST_SECRET = randomUUID();
    try {
      const result = await run(`#include <cstdio>
#include <cstdlib>
#include <cerrno>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
int main(){
  if(getuid()==0 || std::getenv("ALEXANDRIA_RUNNER_TEST_SECRET"))return 1;
  if(std::fopen(${JSON.stringify(sentinel)},"r"))return 2;
  if(std::fopen("/usr/local/lib/alexandria/compile.sh","w"))return 3;
  int fd=socket(AF_INET,SOCK_STREAM,0);sockaddr_in address{};address.sin_family=AF_INET;
  address.sin_port=htons(443);inet_pton(AF_INET,"1.1.1.1",&address.sin_addr);
  if(connect(fd,reinterpret_cast<sockaddr*>(&address),sizeof(address))==0)return 4;
  std::puts("isolated");
}`);
      assert.equal(result.status, 'success', JSON.stringify(result));
      assert.equal(result.stdout, 'isolated\n');
      const compile = await run(`#include ${JSON.stringify(sentinel)}\nint main(){}`);
      assert.equal(compile.status, 'compile_error');
    } finally {
      delete process.env.ALEXANDRIA_RUNNER_TEST_SECRET;
      await rm(directory, { recursive: true, force: true });
    }
    assert.equal(names(), '');
  });

  await t.test('fork pressure is capped and detached descendants are removed after return', async () => {
    const capped = await run(`#include <unistd.h>
#include <signal.h>
#include <sys/wait.h>
#include <cstdio>
#include <cerrno>
int main(){pid_t kids[128];int n=0;for(;n<128;n++){pid_t p=fork();if(p<0)break;if(p==0){pause();_exit(0);}kids[n]=p;}
for(int i=0;i<n;i++){kill(kids[i],SIGKILL);waitpid(kids[i],nullptr,0);}std::printf("%d\\n",n);return n<64?0:1;}`);
    assert.equal(capped.status, 'success', JSON.stringify(capped));
    assert.ok(Number(capped.stdout) > 0 && Number(capped.stdout) < 64);
    const detached = await run('#include <unistd.h>\nint main(){if(fork()==0){setsid();close(0);close(1);close(2);for(;;)pause();}return 0;}');
    assert.equal(detached.status, 'success', JSON.stringify(detached));
    assert.equal(names(), '');
  });

  await t.test('global concurrency, per-user cooldown and cancellation release jobs safely', async () => {
    const controller = new AbortController();
    const userId = randomUUID();
    const pending = runner.run(userId, { language: 'cpp', source: 'int main(){for(;;){}}', stdin: '' }, controller.signal);
    const interrupted = assert.rejects(pending, errorStatus(499));
    const second = createCodeRunner({ image: process.env.CODE_RUNNER_IMAGE });
    await assert.rejects(second.run(randomUUID(), { language: 'cpp', source: 'int main(){}', stdin: '' }), errorStatus(429));
    await second.close();
    const timer = setTimeout(() => controller.abort(), 1_000);
    try { await interrupted; } finally { clearTimeout(timer); }
    assert.equal(names(), '');
    await assert.rejects(runner.run(userId, { language: 'cpp', source: 'int main(){}', stdin: '' }), errorStatus(429));
    assert.equal((await run('int main(){}')).status, 'success');
    const closing = runner.run(randomUUID(), { language: 'cpp', source: 'int main(){for(;;){}}', stdin: '' });
    const closed = assert.rejects(closing, errorStatus(499));
    await runner.close();
    await closed;
    assert.equal(names(), '');
    assert.equal((await runner.status()).available, false);
  });
});
