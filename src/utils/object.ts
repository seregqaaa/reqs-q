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

/**
 * Protects provided object from changes.
 *
 * @param {any} object Object to be protected.
 * @param {string[]} allowedPropNames Prop names can be accessed.
 * @param {Error} error Error to be throwed.
 * @returns
 */
export function protectObject(
  object,
  allowedPropNames = ['length'],
  error = new Error('This object is read-only'),
) {
  return new Proxy(object, {
    get: (queue, propName) => {
      if (allowedPropNames.includes(propName)) {
        return queue[propName];
      }
      throw error;
    },
    set: () => {
      throw error;
    },
  });
}
