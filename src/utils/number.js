export function* infinite() {
  let i = 0;
  while (true) {
    return ++i;
  }
}

export function getUniqInt() {
  return infinite().next().value;
}
