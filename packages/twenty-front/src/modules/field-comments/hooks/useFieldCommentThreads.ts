import { useCallback, useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import { FIELD_COMMENT_NOTE_TARGET_GQL_FIELDS } from '@/field-comments/constants/FieldCommentNoteTargetGqlFields';
import { useRepliesByRootNoteId } from '@/field-comments/hooks/useRepliesByRootNoteId';
import { type FieldCommentNoteTarget } from '@/field-comments/types/FieldComment';
import { mapNoteTargetsToThreads } from '@/field-comments/utils/mapNoteTargetsToThreads';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

type UseFieldCommentThreadsParams = {
  recordId: string;
  objectNameSingular: string;
  fieldMetadataId: string;
  skip?: boolean;
};

export const useFieldCommentThreads = ({
  recordId,
  objectNameSingular,
  fieldMetadataId,
  skip,
}: UseFieldCommentThreadsParams) => {
  const targetJoinColumn = getActivityTargetObjectFieldIdName({
    nameSingular: objectNameSingular,
  });

  const {
    records,
    loading,
    refetch: refetchTargets,
  } = useFindManyRecords<FieldCommentNoteTarget>({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
    filter: {
      [targetJoinColumn]: { eq: recordId },
      targetFieldMetadataId: { eq: fieldMetadataId },
    },
    recordGqlFields: FIELD_COMMENT_NOTE_TARGET_GQL_FIELDS,
    skip,
  });

  const rootThreads = useMemo(
    () => mapNoteTargetsToThreads(records),
    [records],
  );

  const rootNoteIds = useMemo(
    () => rootThreads.map((thread) => thread.id).sort(),
    [rootThreads],
  );

  const { repliesByRootNoteId, refetch: refetchReplies } =
    useRepliesByRootNoteId(rootNoteIds);

  const threads = useMemo(
    () =>
      rootThreads
        .map((thread) => ({
          ...thread,
          replies: repliesByRootNoteId[thread.id] ?? [],
        }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [rootThreads, repliesByRootNoteId],
  );

  const refetch = useCallback(async () => {
    await Promise.all([refetchTargets?.(), refetchReplies?.()]);
  }, [refetchTargets, refetchReplies]);

  return {
    threads,
    threadCount: threads.length,
    loading,
    refetch,
  };
};
