import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { useActivityTargetObjectRecords } from '@/activities/hooks/useActivityTargetObjectRecords';
import { getObjectRecordIdentifier } from '@/object-metadata/utils/getObjectRecordIdentifier';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

type NoteFieldCommentTarget = {
  objectNameSingular: string;
  recordId: string;
  fieldMetadataId: string;
  fieldLabel: string;
  recordName: string;
};

type NoteTargetFieldRow = {
  __typename: string;
  id: string;
  targetFieldMetadataId: string | null;
};

// For a note that is a field comment, resolves where it lives: the anchored
// record (object + id + display name) and the field it's attached to. Returns
// null for regular notes (no targetFieldMetadataId) so callers can render
// nothing. A field comment note always has exactly one noteTarget.
export const useNoteFieldCommentTarget = (
  noteId: string,
): NoteFieldCommentTarget | null => {
  const { activityTargetObjectRecords } =
    useActivityTargetObjectRecords(noteId);

  const { records } = useFindManyRecords<NoteTargetFieldRow>({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
    filter: {
      noteId: { eq: noteId },
      targetFieldMetadataId: { is: 'NOT_NULL' },
    },
    recordGqlFields: { id: true, targetFieldMetadataId: true },
    skip: !noteId,
  });

  const targetFieldMetadataId = records[0]?.targetFieldMetadataId ?? null;
  const target = activityTargetObjectRecords[0];

  if (!isDefined(targetFieldMetadataId) || !isDefined(target)) {
    return null;
  }

  const fieldMetadataItem = target.targetObjectMetadataItem.fields.find(
    (field) => field.id === targetFieldMetadataId,
  );

  const recordName = getObjectRecordIdentifier({
    objectMetadataItem: target.targetObjectMetadataItem,
    record: target.targetObject,
    allowRequestsToTwentyIcons: false,
  }).name;

  return {
    objectNameSingular: target.targetObjectMetadataItem.nameSingular,
    recordId: target.targetObject.id,
    fieldMetadataId: targetFieldMetadataId,
    fieldLabel: fieldMetadataItem?.label ?? '',
    recordName,
  };
};
