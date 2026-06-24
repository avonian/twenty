import { useCallback } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import {
  NOTE_BUCKET,
  type NoteBucketValue,
} from '@/field-comments/constants/NoteBucket';
import { useFieldCommentTypeField } from '@/field-comments/hooks/useFieldCommentTypeField';
import { useNoteBucketField } from '@/field-comments/hooks/useNoteBucketField';
import { noteTargetMatchesBucket } from '@/field-comments/utils/noteTargetMatchesBucket';
import { LOAD_RELATED_NOTES_OBJECT_NAME_SINGULAR } from '@/load-related-notes/constants/LoadRelatedNotesObjectNameSingular';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useDestroyOneRecord } from '@/object-record/hooks/useDestroyOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

// noteTarget FK columns that point at a note's *source* record (everything
// except the evento link we add). First non-null one wins as the jump target.
const SOURCE_TARGET_COLUMNS: { column: string; objectNameSingular: string }[] =
  [
    { column: 'targetPaisId', objectNameSingular: 'pais' },
    { column: 'targetDistribuidorId', objectNameSingular: 'distribuidor' },
    { column: 'targetPerformanceId', objectNameSingular: 'performance' },
    { column: 'targetCompanyId', objectNameSingular: 'company' },
    { column: 'targetPersonId', objectNameSingular: 'person' },
    { column: 'targetOpportunityId', objectNameSingular: 'opportunity' },
  ];

export type EventoRelatedNoteSource = {
  objectNameSingular: string;
  recordId: string;
  fieldMetadataId: string | null;
};

export type EventoRelatedNoteRow = {
  // The noteTarget linking this note to the evento — destroyed when pruning.
  eventoNoteTargetId: string;
  noteId: string;
  nombre: string;
  tipoLabel: string;
  comentario: string;
  createdBy: string;
  source: EventoRelatedNoteSource | null;
};

type NoteRecord = {
  id: string;
  title: string | null;
  bodyV2: { markdown: string | null } | null;
  createdBy: { name: string | null } | null;
} & Record<string, unknown>;

type EventoLinkRow = {
  __typename: string;
  id: string;
  noteId: string | null;
  note: NoteRecord | null;
};

type NoteTargetRow = {
  __typename: string;
  id: string;
  noteId: string | null;
  targetFieldMetadataId: string | null;
} & Record<string, unknown>;

// Powers the Evento's custom Notes table: every note linked to the evento (via
// noteTarget, record-level or field-anchored alike) plus, for each, where it
// originally came from so a row click can jump to that source thread.
export const useEventoRelatedNotes = (
  eventoId: string,
  bucket: NoteBucketValue = NOTE_BUCKET.NOTE,
) => {
  const apolloCoreClient = useApolloCoreClient();
  const { fieldCommentTypeField } = useFieldCommentTypeField();
  const typeFieldName = fieldCommentTypeField?.name;
  const { noteBucketField } = useNoteBucketField();
  const bucketFieldName = noteBucketField?.name;

  const eventoTargetColumn = getActivityTargetObjectFieldIdName({
    nameSingular: LOAD_RELATED_NOTES_OBJECT_NAME_SINGULAR,
  });

  const { records: eventoLinksAllBuckets, loading: loadingLinks } =
    useFindManyRecords<EventoLinkRow>({
      objectNameSingular: CoreObjectNameSingular.NoteTarget,
      filter: { [eventoTargetColumn]: { eq: eventoId } },
      recordGqlFields: {
        id: true,
        noteId: true,
        note: {
          id: true,
          title: true,
          bodyV2: { markdown: true },
          createdBy: { name: true },
          ...(isDefined(typeFieldName) ? { [typeFieldName]: true } : {}),
          ...(isDefined(bucketFieldName) ? { [bucketFieldName]: true } : {}),
        },
      },
    });

  // Keep only the requested bucket — comments and objectives share the evento's
  // noteTargets but surface in separate tabs.
  const eventoLinks = eventoLinksAllBuckets.filter((link) =>
    noteTargetMatchesBucket(link, bucketFieldName, bucket),
  );

  const noteIds = eventoLinks.map((link) => link.noteId).filter(isDefined);

  // A note's *other* targets (its origin) — to deep-link the row to its source.
  const { records: allNoteTargets } = useFindManyRecords<NoteTargetRow>({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
    filter: { noteId: { in: noteIds } },
    recordGqlFields: {
      id: true,
      noteId: true,
      targetFieldMetadataId: true,
      targetPaisId: true,
      targetDistribuidorId: true,
      targetPerformanceId: true,
      targetCompanyId: true,
      targetPersonId: true,
      targetOpportunityId: true,
      targetEventoId: true,
    },
    skip: noteIds.length === 0,
  });

  const typeOptions = fieldCommentTypeField?.options ?? [];

  const resolveSource = (
    noteId: string,
    eventoLinkId: string,
  ): EventoRelatedNoteSource | null => {
    const candidates = allNoteTargets.filter(
      (target) => target.noteId === noteId && target.id !== eventoLinkId,
    );

    for (const candidate of candidates) {
      const match = SOURCE_TARGET_COLUMNS.find((source) =>
        isDefined(candidate[source.column]),
      );

      if (isDefined(match)) {
        return {
          objectNameSingular: match.objectNameSingular,
          recordId: candidate[match.column] as string,
          fieldMetadataId: candidate.targetFieldMetadataId,
        };
      }
    }

    return null;
  };

  const rows: EventoRelatedNoteRow[] = eventoLinks
    .filter((link) => isDefined(link.noteId) && isDefined(link.note))
    .map((link) => {
      const note = link.note as NoteRecord;
      const typeValue = isDefined(typeFieldName)
        ? (note[typeFieldName] as string | null)
        : null;
      const tipoLabel =
        typeOptions.find((option) => option.value === typeValue)?.label ??
        typeValue ??
        '';

      return {
        eventoNoteTargetId: link.id,
        noteId: note.id,
        nombre: note.title ?? '',
        tipoLabel,
        // Field-comment notes keep their text in the title (no body), so fall
        // back to it — the "main comment" column should never be empty.
        comentario: note.bodyV2?.markdown || note.title || '',
        createdBy: note.createdBy?.name ?? '',
        source: resolveSource(note.id, link.id),
      };
    });

  const { destroyOneRecord } = useDestroyOneRecord({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
  });

  const removeFromEvento = useCallback(
    async (eventoNoteTargetId: string) => {
      await destroyOneRecord(eventoNoteTargetId);
      await apolloCoreClient.refetchQueries({ include: 'active' });
    },
    [apolloCoreClient, destroyOneRecord],
  );

  return { rows, loading: loadingLinks, removeFromEvento };
};
