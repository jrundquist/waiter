export function most<T>(arr: T[], filter: (a: T) => boolean, percent: number = 0.85): boolean {
  return arr.filter(filter).length / arr.length >= percent;
}
