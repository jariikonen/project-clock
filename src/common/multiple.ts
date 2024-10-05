export default function multiple(term: string, number: number) {
  if (number === 0) {
    return [`${term}s`, 'no'];
  }
  return number === 1 ? [`${term}`, '1'] : [`${term}s`, `${number}`];
}
