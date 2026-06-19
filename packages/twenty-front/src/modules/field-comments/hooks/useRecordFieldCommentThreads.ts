import { useCallback, useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import { FIELD_COMMENT_NOTE_TARGET_GQL_FIELDS } from '@/field-comments/constants/FieldCommentNoteTargetGqlFields';
import { useRepliesByRootNoteId } from '@/field-comments/hooks/useRepliesByRootNoteId';
import {
  type FieldCommentFieldGroup,
  type FieldCommentRecordNoteTarget,
} from '@/field-comments/types/FieldComment';
import { mapNoteTargetsToThreads } from '@/field-comments/utils/mapNoteTargetsToThreads';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

const RECORD_FIELD_COMMENT_NOTE_TARGET_GQL_FIELDS = {
  ...FIELD_COMMENT_NOTE_TARGET_GQL_FIELDS,
  targetFieldMetadataId: true,
};

type UseRecordFieldCommentThreadsParams = {
  recordId: string;
  objectNameSingular: string;
  skip?: boolean;
};

export const useRecordFieldCommentThreads = ({
  recordId,
  objectNameSingular,
  skip,
}: UseRecordFieldCommentThreadsParams) => {
  const { objectMetadataItems } = useObjectMetadataItems();

  const targetJoinColumn = getActivityTargetObjectFieldIdName({
    nameSingular: objectNameSingular,
  });

  const {
    records,
    loading,
    refetch: refetchTargets,
  } = useFindManyRecords<FieldCommentRecordNoteTarget>({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
    filter: {
      [targetJoinColumn]: { eq: recordId },
      targetFieldMetadataId: { is: 'NOT_NULL' },
    },
    recordGqlFields: RECORD_FIELD_COMMENT_NOTE_TARGET_GQL_FIELDS,
    skip,
  });

  const objectMetadataItem = useMemo(
    () =>
      objectMetadataItems.find(
        (item) => item.nameSingular === objectNameSingular,
      ),
    [objectMetadataItems, objectNameSingular],
  );

  // Roots grouped by field (replies attached in a second pass below).
  const rootGroups = useMemo(() => {
    const noteTargetsByFieldMetadataId = new Map<
      string,
      FieldCommentRecordNoteTarget[]
    >();

    for (const noteTarget of records) {
      const fieldMetadataId = noteTarget.targetFieldMetadataId;
      if (!isDefined(fieldMetadataId)) {
        continue;
      }
      const existing = noteTargetsByFieldMetadataId.get(fieldMetadataId) ?? [];
      existing.push(noteTarget);
      noteTargetsByFieldMetadataId.set(fieldMetadataId, existing);
    }

    return Array.from(noteTargetsByFieldMetadataId.entries())
      .map(([fieldMetadataId, noteTargets]) => {
        const field = objectMetadataItem?.fields.find(
          (item) => item.id === fieldMetadataId,
        );

        return {
          fieldMetadataId,
          fieldLabel: field?.label ?? fieldMetadataId,
          threads: mapNoteTargetsToThreads(noteTargets),
        };
      })
      .filter((group) => group.threads.length > 0);
  }, [records, objectMetadataItem]);

  const rootNoteIds = useMemo(
    () =>
      rootGroups
        .flatMap((group) => group.threads.map((thread) => thread.id))
        .sort(),
    [rootGroups],
  );

  const { repliesByRootNoteId, refetch: refetchReplies } =
    useRepliesByRootNoteId(rootNoteIds);

  const fieldGroups: FieldCommentFieldGroup[] = useMemo(
    () =>
      rootGroups.map((group) => ({
        ...group,
        threads: group.threads
          .map((thread) => ({
            ...thread,
            replies: repliesByRootNoteId[thread.id] ?? [],
          }))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      })),
    [rootGroups, repliesByRootNoteId],
  );

  const totalThreadCount = useMemo(
    () => fieldGroups.reduce((sum, group) => sum + group.threads.length, 0),
    [fieldGroups],
  );

  const refetch = useCallback(async () => {
    await Promise.all([refetchTargets?.(), refetchReplies?.()]);
  }, [refetchTargets, refetchReplies]);

  return {
    fieldGroups,
    totalThreadCount,
    loading,
    refetch,
  };
};
