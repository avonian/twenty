import { type RecordGqlOperationFilter } from 'twenty-shared/types';

import { isVersionedObjectNameSingular } from './isVersionedObjectNameSingular';

export const getVersionedObjectIndexFilter = (
  objectNameSingular: string,
): RecordGqlOperationFilter | undefined => {
  if (isVersionedObjectNameSingular(objectNameSingular)) {
    return { isLatest: { eq: true } };
  }

  return undefined;
};
