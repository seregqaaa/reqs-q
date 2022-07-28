export function getRandomFloat(max: number = 2 ** 48): number {
  return Math.random() * max;
}

export function getRandomInt(max: number = 2 ** 48): number {
  return Math.ceil(getRandomFloat(max));
}
