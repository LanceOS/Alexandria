import { CODE_RUNNER_LIMITS, type CodeRunResult, type CodeRunnerStatus } from '../../../../../shared/code-runner';

export const CPP_STARTER = '#include <iostream>\n\nint main() {\n    std::cout << "Hello, Alexandria!\\n";\n    return 0;\n}\n';

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const resultStatuses = ['success', 'compile_error', 'runtime_error', 'time_limit', 'output_limit'];

export function isCodeRunResult(value: unknown): value is CodeRunResult {
  return record(value) && typeof value.status === 'string' && resultStatuses.includes(value.status)
    && typeof value.stdout === 'string' && typeof value.stderr === 'string' && typeof value.compileOutput === 'string'
    && (value.exitCode === null || Number.isInteger(value.exitCode))
    && typeof value.durationMs === 'number' && Number.isFinite(value.durationMs) && value.durationMs >= 0;
}

export function isCodeRunnerStatus(value: unknown): value is CodeRunnerStatus {
  if (!record(value) || typeof value.available !== 'boolean' || value.language !== 'cpp' || value.standard !== 'C++20'
    || typeof value.message !== 'string' || !record(value.limits)) return false;
  const limits = value.limits;
  return Object.entries(CODE_RUNNER_LIMITS).every(([key, limit]) => limits[key] === limit);
}

export function codeInputError(source: string, stdin: string): string | null {
  if (!source.trim()) return 'Add a C++ program before running it.';
  if (source.includes('\0') || stdin.includes('\0')) return 'Remove null characters from the program and its input before running.';
  const encoder = new TextEncoder();
  if (encoder.encode(source).length > CODE_RUNNER_LIMITS.sourceBytes) return 'Keep your program within 32 KiB.';
  if (encoder.encode(stdin).length > CODE_RUNNER_LIMITS.stdinBytes) return 'Keep program input within 8 KiB.';
  return null;
}

export function codeResultLabel(result: CodeRunResult): string {
  switch (result.status) {
    case 'success': return 'Program finished successfully.';
    case 'compile_error': return 'Compilation failed. Check the compiler messages below.';
    case 'runtime_error': return `Program ended with an error${result.exitCode === null ? '' : ` (exit code ${result.exitCode})`}.`;
    case 'time_limit': return 'Time limit reached. Check for an endless loop or a slow operation.';
    case 'output_limit': return 'Output limit reached. Try printing fewer values.';
  }
}
