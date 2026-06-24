import { useCallback } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import {
  NOTE_BUCKET,
  type NoteBucketValue,
} from '@/field-comments/constants/NoteBucket';
import { useNoteBucketField } from '@/field-comments/hooks/useNoteBucketField';
import { noteTargetMatchesBucket } from '@/field-comments/utils/noteTargetMatchesBucket';
import { LOAD_RELATED_NOTES_OBJECT_NAME_SINGULAR } from '@/load-related-notes/constants/LoadRelatedNotesObjectNameSingular';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindManyRecordsQuery } from '@/object-record/hooks/useFindManyRecordsQuery';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

type NoteTargetRow = {
  id: string;
  noteId: string | null;
  note?: Record<string, unknown> | null;
};

type LoadResult = { linked: number; skipped: number };

// Links the source record's notes of the given bucket onto the target evento by
// creating noteTargets — sharing the same notes (not copies), deduped against
// what the evento already has. Comments and objectives use the same flow,
// scoped by bucket.
export const useLoadRelatedNotes = (
  eventoId: string,
  bucket: NoteBucketValue = NOTE_BUCKET.NOTE,
) => {
  const apolloCoreClient = useApolloCoreClient();

  const { noteBucketField } = useNoteBucketField();
  const bucketFieldName = noteBucketField?.name;

  const { findManyRecordsQuery } = useFindManyRecordsQuery({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
    recordGqlFields: {
      id: true,
      noteId: true,
      note: {
        id: true,
        ...(isDefined(bucketFieldName) ? { [bucketFieldName]: true } : {}),
      },
    },
  });

  const { createOneRecord: createOneNoteTarget } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
    recordGqlFields: { id: true },
  });

  const eventoTargetColumn = getActivityTargetObjectFieldIdName({
    nameSingular: LOAD_RELATED_NOTES_OBJECT_NAME_SINGULAR,
  });

  const fetchNoteIds = useCallback(
    async (targetColumn: string, recordId: string): Promise<string[]> => {
      const result = await apolloCoreClient.query<{
        noteTargets: { edges: { node: NoteTargetRow }[] };
      }>({
        query: findManyRecordsQuery,
        variables: {
          // All of the source's notes — record-level and field-anchored alike;
          // they're a single Notes module, no distinction to filter on.
          filter: { [targetColumn]: { eq: recordId } },
          limit: 200,
        },
        fetchPolicy: 'network-only',
      });

      return (result.data?.noteTargets.edges ?? [])
        .filter((edge) =>
          noteTargetMatchesBucket(edge.node, bucketFieldName, bucket),
        )
        .map((edge) => edge.node.noteId)
        .filter(isDefined);
    },
    [apolloCoreClient, findManyRecordsQuery, bucketFieldName, bucket],
  );

  const loadNotesFromSource = useCallback(
    async (
      sourceObjectNameSingular: string,
      sourceRecordId: string,
    ): Promise<LoadResult> => {
      const sourceTargetColumn = getActivityTargetObjectFieldIdName({
        nameSingular: sourceObjectNameSingular,
      });

      const sourceNoteIds = [
        ...new Set(await fetchNoteIds(sourceTargetColumn, sourceRecordId)),
      ];
      const alreadyLinked = new Set(
        await fetchNoteIds(eventoTargetColumn, eventoId),
      );

      const noteIdsToLink = sourceNoteIds.filter(
        (noteId) => !alreadyLinked.has(noteId),
      );

      for (const noteId of noteIdsToLink) {
        await createOneNoteTarget({
          noteId,
          [eventoTargetColumn]: eventoId,
          targetFieldMetadataId: null,
        } as Partial<ObjectRecord>);
      }

      // Refresh the Notes tab (and any other active list) so the linked notes
      // appear immediately.
      await apolloCoreClient.refetchQueries({ include: 'active' });

      return {
        linked: noteIdsToLink.length,
        skipped: sourceNoteIds.length - noteIdsToLink.length,
      };
    },
    [
      apolloCoreClient,
      createOneNoteTarget,
      eventoId,
      eventoTargetColumn,
      fetchNoteIds,
    ],
  );

  return { loadNotesFromSource };
};
