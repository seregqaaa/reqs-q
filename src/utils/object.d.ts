/**
 * Returns value of provided field.
 *
 * @param {Record<string, any>} currentObj Source object.
 * @param {string[] | string} rawPath Field path.
 */
export declare function getDeepField(currentObj: Record<string, any>, rawPath: string | string[]): any;
/**
 * Protects provided object from changes.
 *
 * @param {any} object Object to be protected.
 * @param {string[]} allowedPropNames Prop names can be accessed.
 * @param {Error} error Error to be throwed.
 * @returns
 */
export declare function protectObject(object: any, allowedPropNames?: string[], error?: Error): any;
//# sourceMappingURL=object.d.ts.map