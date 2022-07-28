/**
 * Returns value of provided field.
 *
 * @param {Record<string, any>} currentObj Source object.
 * @param {string[] | string} rawPath Field path.
 */
export function getDeepField(
  currentObj: Record<string, any>,
  rawPath: string | string[],
): any {
  const path: string[] = [];
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
  object: any,
  allowedPropNames: string[] = ['length'],
  error: Error = new Error('This object is read-only'),
) {
  return new Proxy(object, {
    get: (target: any, propName: string) => {
      if (allowedPropNames.includes(propName)) {
        return target[propName];
      }
      throw error;
    },
    set: () => {
      throw error;
    },
  });
}
