import { useEffect, useMemo } from 'react';
import {
  CoreObjectNameSingular,
  type RecordGqlOperationGqlRecordFields,
} from 'twenty-shared/types';
import {
  computeMorphRelationGqlFieldName,
  isDefined,
} from 'twenty-shared/utils';

import { type Note } from '@/activities/types/Note';
import { type NoteTarget } from '@/activities/types/NoteTarget';
import { getActivityTargetObjectRecords } from '@/activities/utils/getActivityTargetObjectRecords';
import {
  type NoteFieldCommentTarget,
  noteFieldCommentTargetByNoteIdState,
} from '@/field-comments/states/noteFieldCommentTargetByNoteIdState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { FieldMetadataType } from '~/generated-metadata/graphql';

// Prefetch, for the Notes index, where every field-comment note points so a
// click can jump straight to the target. Queries field-anchored noteTargets
// once (targetFieldMetadataId is set), resolves each polymorphic target via the
// shared activities resolver, and stores a noteId -> target map.
export const usePrefetchNoteFieldCommentTargets = (enabled: boolean) => {
  const { objectMetadataItems } = useObjectMetadataItems();

  const setNoteFieldCommentTargetByNoteId = useSetAtomState(
    noteFieldCommentTargetByNoteIdState,
  );

  const noteTargetObjectMetadataItem = objectMetadataItems.find(
    (objectMetadataItem) =>
      objectMetadataItem.nameSingular === CoreObjectNameSingular.NoteTarget,
  );

  // Build the gql selection for the polymorphic `target` morph relation (one
  // sub-field per possible target object) plus the note + field anchor.
  const recordGqlFields = useMemo<RecordGqlOperationGqlRecordFields>(() => {
    const morphTargetFields: RecordGqlOperationGqlRecordFields = {};

    for (const field of noteTargetObjectMetadataItem?.fields ?? []) {
      if (
        field.type !== FieldMetadataType.MORPH_RELATION ||
        !isDefined(field.morphRelations)
      ) {
        continue;
      }

      for (const morphRelation of field.morphRelations) {
        const morphFieldName = computeMorphRelationGqlFieldName({
          fieldName: field.name,
          relationType: morphRelation.type,
          targetObjectMetadataNameSingular:
            morphRelation.targetObjectMetadata.nameSingular,
          targetObjectMetadataNamePlural:
            morphRelation.targetObjectMetadata.namePlural,
        });

        morphTargetFields[morphFieldName] = { id: true };
      }
    }

    return {
      id: true,
      targetFieldMetadataId: true,
      note: { id: true },
      ...morphTargetFields,
    };
  }, [noteTargetObjectMetadataItem]);

  const { records } = useFindManyRecords<ObjectRecord>({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
    filter: { targetFieldMetadataId: { is: 'NOT_NULL' } },
    recordGqlFields,
    limit: 200,
    skip: !enabled || !isDefined(noteTargetObjectMetadataItem),
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const resolvedTargets = getActivityTargetObjectRecords({
      // Only used to flag these as note (not task) targets.
      activityRecord: { noteTargets: [] } as unknown as Note,
      objectMetadataItems,
      activityTargets: records as unknown as NoteTarget[],
    });

    const nextMap: Record<string, NoteFieldCommentTarget> = {};

    for (const resolvedTarget of resolvedTargets) {
      const activityTarget = resolvedTarget.activityTarget as NoteTarget & {
        note?: { id: string } | null;
        targetFieldMetadataId?: string | null;
      };

      const noteId = activityTarget.note?.id;
      const fieldMetadataId = activityTarget.targetFieldMetadataId;

      if (!isDefined(noteId) || !isDefined(fieldMetadataId)) {
        continue;
      }

      nextMap[noteId] = {
        objectNameSingular:
          resolvedTarget.targetObjectMetadataItem.nameSingular,
        recordId: resolvedTarget.targetObject.id,
        fieldMetadataId,
      };
    }

    setNoteFieldCommentTargetByNoteId(nextMap);
  }, [
    enabled,
    records,
    objectMetadataItems,
    setNoteFieldCommentTargetByNoteId,
  ]);
};
