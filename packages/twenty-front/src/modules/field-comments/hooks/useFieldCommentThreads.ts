import { useCallback, useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import { getFieldCommentNoteTargetGqlFields } from '@/field-comments/constants/FieldCommentNoteTargetGqlFields';
import { useFieldCommentTypeField } from '@/field-comments/hooks/useFieldCommentTypeField';
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

  const { fieldCommentTypeField } = useFieldCommentTypeField();
  const typeFieldName = fieldCommentTypeField?.name;

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
    recordGqlFields: getFieldCommentNoteTargetGqlFields(typeFieldName),
    skip,
  });

  const rootThreads = useMemo(
    () => mapNoteTargetsToThreads(records, typeFieldName),
    [records, typeFieldName],
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
