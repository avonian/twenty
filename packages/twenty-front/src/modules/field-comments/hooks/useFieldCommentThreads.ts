import { useCallback, useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import { getFieldCommentNoteTargetGqlFields } from '@/field-comments/constants/FieldCommentNoteTargetGqlFields';
import {
  NOTE_BUCKET,
  type NoteBucketValue,
} from '@/field-comments/constants/NoteBucket';
import { useFieldCommentTypeField } from '@/field-comments/hooks/useFieldCommentTypeField';
import { useNoteBucketField } from '@/field-comments/hooks/useNoteBucketField';
import { useRepliesByRootNoteId } from '@/field-comments/hooks/useRepliesByRootNoteId';
import { type FieldCommentNoteTarget } from '@/field-comments/types/FieldComment';
import { mapNoteTargetsToThreads } from '@/field-comments/utils/mapNoteTargetsToThreads';
import { noteTargetMatchesBucket } from '@/field-comments/utils/noteTargetMatchesBucket';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

type UseFieldCommentThreadsParams = {
  recordId: string;
  objectNameSingular: string;
  fieldMetadataId: string;
  bucket?: NoteBucketValue;
  skip?: boolean;
};

export const useFieldCommentThreads = ({
  recordId,
  objectNameSingular,
  fieldMetadataId,
  bucket = NOTE_BUCKET.NOTE,
  skip,
}: UseFieldCommentThreadsParams) => {
  const targetJoinColumn = getActivityTargetObjectFieldIdName({
    nameSingular: objectNameSingular,
  });

  const { fieldCommentTypeField } = useFieldCommentTypeField();
  const typeFieldName = fieldCommentTypeField?.name;

  const { noteBucketField } = useNoteBucketField();
  const bucketFieldName = noteBucketField?.name;

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
    recordGqlFields: getFieldCommentNoteTargetGqlFields(
      typeFieldName,
      bucketFieldName,
    ),
    skip,
  });

  const rootThreads = useMemo(
    () =>
      mapNoteTargetsToThreads(
        records.filter((noteTarget) =>
          noteTargetMatchesBucket(noteTarget, bucketFieldName, bucket),
        ),
        typeFieldName,
      ),
    [records, typeFieldName, bucketFieldName, bucket],
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
