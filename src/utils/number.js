export function getRandomFloat(max = 2 ** 48) {
  return Math.random() * max;
}

export function getRandomInt(max = 2 ** 48) {
  return Math.ceil(getRandomFloat(max));
}
