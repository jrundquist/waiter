export function roughlyEqual(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) < epsilon;
}
