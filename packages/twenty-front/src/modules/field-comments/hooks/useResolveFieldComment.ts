import { useCallback } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

const RESOLVE_NOTE_GQL_FIELDS = {
  id: true,
  isResolved: true,
  resolvedAt: true,
};

export const useResolveFieldComment = () => {
  const { updateOneRecord } = useUpdateOneRecord();

  const resolveFieldComment = useCallback(
    async ({
      rootNoteId,
      isResolved,
    }: {
      rootNoteId: string;
      isResolved: boolean;
    }) => {
      await updateOneRecord<ObjectRecord>({
        objectNameSingular: CoreObjectNameSingular.Note,
        idToUpdate: rootNoteId,
        updateOneRecordInput: {
          isResolved,
          resolvedAt: isResolved ? new Date().toISOString() : null,
        },
        recordGqlFields: RESOLVE_NOTE_GQL_FIELDS,
      });
    },
    [updateOneRecord],
  );

  return { resolveFieldComment };
};
