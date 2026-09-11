export function classes(...values: (string | undefined | false)[]) {
  return values.filter(Boolean).join(' ');
}
