import { useCallback } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

const CREATE_REPLY_NOTE_GQL_FIELDS = {
  id: true,
  title: true,
  parentNoteId: true,
};

export const useReplyToFieldComment = () => {
  // A reply is a note with parentNoteId set and no noteTarget.
  const { createOneRecord: createOneNote } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Note,
    recordGqlFields: CREATE_REPLY_NOTE_GQL_FIELDS,
  });

  const replyToFieldComment = useCallback(
    async ({ rootNoteId, text }: { rootNoteId: string; text: string }) => {
      await createOneNote({
        title: text,
        position: 0,
        updatedAt: new Date().toISOString(),
        parentNoteId: rootNoteId,
      } as Partial<ObjectRecord>);
    },
    [createOneNote],
  );

  return { replyToFieldComment };
};
