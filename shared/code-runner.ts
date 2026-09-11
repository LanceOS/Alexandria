export const CODE_RUNNER_LIMITS = {
  sourceBytes: 32 * 1024,
  stdinBytes: 8 * 1024,
  outputBytes: 32 * 1024,
  compileSeconds: 15,
  runSeconds: 3,
  memoryMb: 256,
} as const;

export interface CodeRunInput {
  language: 'cpp';
  source: string;
  stdin: string;
}

export interface CodeRunResult {
  status: 'success' | 'compile_error' | 'runtime_error' | 'time_limit' | 'output_limit';
  stdout: string;
  stderr: string;
  compileOutput: string;
  exitCode: number | null;
  durationMs: number;
}

export interface CodeRunnerStatus {
  available: boolean;
  language: 'cpp';
  standard: 'C++20';
  message: string;
  limits: typeof CODE_RUNNER_LIMITS;
}
