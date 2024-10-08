export default function multiple(
  term: string,
  number: number,
  capitalize = false
) {
  if (number === 0) {
    const counter = capitalize ? 'No' : 'no';
    return [`${term}s`, counter];
  }
  return number === 1 ? [`${term}`, '1'] : [`${term}s`, `${number}`];
}
