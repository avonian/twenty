import { useCallback } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

const CREATE_NOTE_GQL_FIELDS = {
  id: true,
  title: true,
  position: true,
};

const CREATE_NOTE_TARGET_GQL_FIELDS = {
  id: true,
};

type UseCreateFieldCommentParams = {
  recordId: string;
  objectNameSingular: string;
  fieldMetadataId: string;
};

export const useCreateFieldComment = ({
  recordId,
  objectNameSingular,
  fieldMetadataId,
}: UseCreateFieldCommentParams) => {
  const targetJoinColumn = getActivityTargetObjectFieldIdName({
    nameSingular: objectNameSingular,
  });

  const { createOneRecord: createOneNote } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Note,
    recordGqlFields: CREATE_NOTE_GQL_FIELDS,
  });

  const { createOneRecord: createOneNoteTarget } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
    recordGqlFields: CREATE_NOTE_TARGET_GQL_FIELDS,
  });

  const createFieldComment = useCallback(
    async (text: string) => {
      const createdNote = await createOneNote({
        title: text,
        position: 0,
        updatedAt: new Date().toISOString(),
      } as Partial<ObjectRecord>);

      await createOneNoteTarget({
        noteId: createdNote.id,
        [targetJoinColumn]: recordId,
        targetFieldMetadataId: fieldMetadataId,
      } as Partial<ObjectRecord>);
    },
    [
      createOneNote,
      createOneNoteTarget,
      targetJoinColumn,
      recordId,
      fieldMetadataId,
    ],
  );

  return { createFieldComment };
};
