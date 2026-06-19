import { useCallback } from 'react';
import { isNonEmptyString } from '@sniptt/guards';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import { useFieldCommentTypeField } from '@/field-comments/hooks/useFieldCommentTypeField';
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

  const { fieldCommentTypeField } = useFieldCommentTypeField();

  const { createOneRecord: createOneNote } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Note,
    recordGqlFields: CREATE_NOTE_GQL_FIELDS,
  });

  const { createOneRecord: createOneNoteTarget } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
    recordGqlFields: CREATE_NOTE_TARGET_GQL_FIELDS,
  });

  const createFieldComment = useCallback(
    async (text: string, typeValue?: string | null) => {
      // Persist the optional "Type" SELECT only when the field exists and a
      // value was chosen — replies never carry it (separate composer).
      const typeFieldPayload =
        isDefined(fieldCommentTypeField) && isNonEmptyString(typeValue)
          ? { [fieldCommentTypeField.name]: typeValue }
          : {};

      const createdNote = await createOneNote({
        title: text,
        position: 0,
        updatedAt: new Date().toISOString(),
        ...typeFieldPayload,
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
      fieldCommentTypeField,
    ],
  );

  return { createFieldComment };
};
