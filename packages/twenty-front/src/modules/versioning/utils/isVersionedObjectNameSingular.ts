const VERSIONED_OBJECT_NAMES = new Set(['performance']);

export const isVersionedObjectNameSingular = (
  objectNameSingular: string,
): boolean => VERSIONED_OBJECT_NAMES.has(objectNameSingular);
