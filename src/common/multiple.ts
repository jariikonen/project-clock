/**
 * Returns forms of the term, number and pronouns suitable to the number value.
 * The counter will be 'no' if the number is 0. Pronouns is an array that
 * contains two pronoun forms.
 * @param term The object of the sentence, e.g., task in 'these three tasks'.
 * @param number The number of something being handled, e.g., three in 'these
 *    three tasks'.
 * @param capitalize Boolean indicating whether the word 'no' or the pronoun
 *    should be capitalized.
 * @returns Term, number and pronoun in an array.
 */
export default function multiple(
  term: string,
  number: number,
  capitalize = false
): [string, string, string[]] {
  if (number === 0) {
    const counter = capitalize ? 'No' : 'no';
    return [`${term}s`, counter, ['', '']];
  }
  if (capitalize) {
    return number === 1
      ? [`${term}`, '1', ['This', 'It']]
      : [`${term}s`, `${number}`, ['These', 'They']];
  }
  return number === 1
    ? [`${term}`, '1', ['this', 'it']]
    : [`${term}s`, `${number}`, ['these', 'they']];
}
