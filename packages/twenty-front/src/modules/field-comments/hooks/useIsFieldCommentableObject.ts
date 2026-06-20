import { isNonEmptyString } from '@sniptt/guards';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';

// Field comments anchor a note to a record via a noteTarget. Only objects that
// noteTarget can actually target are commentable — e.g. note/task themselves
// are not, so querying their threads would fail with "noteTarget has no
// targetNoteId field". The targets live on noteTarget's polymorphic `target`
// morph relation (collapsed into a single field on the frontend), so we read
// the allowed objects from its morphRelations rather than guessing field names.
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

  return (
    noteTargetObjectMetadataItem?.fields.some((field) =>
      field.morphRelations?.some(
        (morphRelation) =>
          morphRelation.targetObjectMetadata?.nameSingular ===
          objectNameSingular,
      ),
    ) ?? false
  );
};
