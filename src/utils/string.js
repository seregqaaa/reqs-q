import { getRandomInt } from './number.js';

export function getRandomString(length = 16, prevString = '') {
  const string = getRandomInt().toString(16) + prevString;
  return string.length < length
    ? getRandomString(length, string)
    : string.substring(0, length);
}
