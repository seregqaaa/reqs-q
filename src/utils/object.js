/**
 * Returns value of provided field.
 *
 * @param {Record<string, any> | any[]} currentObj Source object.
 * @param {string[] | string} rawPath Field path.
 */
export function getDeepField(currentObj, rawPath) {
  const path = [];
  path.push(...(typeof rawPath === 'string' ? rawPath.split('.') : rawPath));
  if (path.length === 0 || typeof currentObj !== 'object') return currentObj;
  const currentField = path[0];
  path.shift();
  return getDeepField(currentObj[currentField], path);
}
