import { getRandomInt } from './number';

export function getRandomString(
  length: number = 16,
  prevString: string = '',
): string {
  const string: string = getRandomInt().toString(16) + prevString;
  return string.length < length
    ? getRandomString(length, string)
    : string.substring(0, length);
}
