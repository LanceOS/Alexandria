# Code area and local execution

C++ lesson examples offer **Edit and run**. Opening this area loads an editable C++20 source field, optional standard input, a Run button, and compiler/program output. C++ sections without a code example offer a starter program. Terminal instructions and output traces stay as copyable examples.

Anyone can edit; execution requires a local learner account. The code area uses the same sign-in dialog as reading progress. Snippets may require headers and a `main()` function before they compile. Input is supplied before a run and closed when consumed: this is a batch console, not an interactive terminal. Programs needing extra libraries, multiple source files, graphics, networking, or longer computation should run in the learner's own development environment.

Drafts and results stay in browser component memory for the current visit. They are not saved to SQLite, sent to an external compiler service, or included in backups. Changing sections or reloading loses the draft; copy code to keep it. Signing out or switching from one learner account to another clears drafts and cancels pending requests. An anonymous draft survives the first sign-in. Running code does not mark reading complete, award XP, or record an assessed attempt.

## Set up the host

Use Linux with rootless Podman, a working subordinate UID/GID mapping, cgroups v2 with CPU/memory/PID controllers, and seccomp support. Run setup and checks as the same operating-system account that starts Alexandria:

```sh
npm run runner:setup
npm run runner:check
```

Setup prepares `localhost/alexandria-cpp-runner:1` from the checked-in container recipe. This is the only step that downloads a compiler image. Execution uses a locally available image with pulling disabled. The verification command exercises real container compilation, execution, errors, and limits without changing the application database.

Configuration is optional:

```dotenv
CODE_RUNNER_ENABLED=true
CODE_RUNNER_IMAGE=localhost/alexandria-cpp-runner:1
```

`CODE_RUNNER_ENABLED=false` disables execution without invoking Podman. `CODE_RUNNER_IMAGE` must name a trusted, locally prepared image with the expected toolchain. Restart the server after changing its environment. Availability is checked lazily and cached briefly, so installing the image does not require a database migration. An unavailable runner leaves library reading and editing available; the code area displays its status and can retry.

The optional hardened system service in `deploy/alexandria.service` is a library-only example: its filesystem and privilege restrictions do not provide the user runtime/storage that rootless Podman needs. Keep execution disabled for that service unless the operator deliberately provisions a compatible rootless runtime. Verify under the actual service account and restrictions before enabling execution; a successful command in another user's terminal does not establish service readiness.

## Execution boundary

The API validates the request, authenticates the learner, checks the session CSRF token and same-origin request marker, then asks the runner for a single execution slot. Busy requests receive HTTP 429 and can retry. There is no unbounded job queue. Code and stdin are passed as data, never interpolated into a host shell command.

Each job uses a fresh rootless container with no host directories or sockets mounted. Compilation and execution both happen inside it. The root filesystem is read-only; temporary work storage is bounded and discarded. The container runs as a non-root user, with capabilities dropped, privilege escalation disabled, a private process namespace, no network, and the runtime's seccomp filter. CPU, memory, process, file, output, and wall-clock limits apply. The API process never loads or executes the resulting binary.

| Limit | Value |
| --- | --- |
| Language | C++20 |
| Source | 32 KiB UTF-8 |
| Standard input | 8 KiB UTF-8 |
| Returned output | 32 KiB |
| Compilation | 15 seconds |
| Program execution | 3 seconds |
| Container memory | 256 MiB |
| Concurrent jobs per application process | 1 |

Compilation diagnostics, stdout, stderr, exit status, and elapsed time are returned as text/data. Compiler failures, runtime failures, time limits, and output limits are distinct from infrastructure failures. Normal completion, cancellation, disconnection, and graceful server shutdown clean up the container. A container lifetime limit also bounds work if the API disappears abruptly.

No application database path, account token, source-book mount, or application environment is provided to the compiler/program. API logs omit request bodies and output. This runner serves an installation with operator-provisioned learner accounts and one API process; it is not a distributed grading service.

The isolation settings follow the [Podman run reference](https://docs.podman.io/en/latest/markdown/podman-run.1.html). Keep the host runtime and trusted compiler image maintained. Image updates are explicit setup operations, so a learner request cannot download or replace an image.
