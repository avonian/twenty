import { isNonEmptyString } from '@sniptt/guards';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { capitalize } from 'twenty-shared/utils';

import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';

// Field comments anchor a note to a record via a noteTarget. Only objects that
// noteTarget can actually target (it has a `target<Object>` morph relation for
// them) are commentable — e.g. note/task themselves are not, so querying their
// threads would fail with "noteTarget has no targetNoteId field".
export const useIsFieldCommentableObject = (
  objectNameSingular: string | undefined,
): boolean => {
  const { objectMetadataItems } = useObjectMetadataItems();

  if (!isNonEmptyString(objectNameSingular)) {
    return false;
  }

  const noteTargetObjectMetadataItem = objectMetadataItems.find(
    (objectMetadataItem) =>
      objectMetadataItem.nameSingular === CoreObjectNameSingular.NoteTarget,
  );

  const targetRelationFieldName = `target${capitalize(objectNameSingular)}`;

  return (
    noteTargetObjectMetadataItem?.fields.some(
      (field) => field.name === targetRelationFieldName,
    ) ?? false
  );
};
