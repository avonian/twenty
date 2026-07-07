import { useOpenActivityTargetCellEditMode } from '@/activities/inline-cell/hooks/useOpenActivityTargetCellEditMode';
import { type Note } from '@/activities/types/Note';
import { type NoteTarget } from '@/activities/types/NoteTarget';
import { type Task } from '@/activities/types/Task';
import { type TaskTarget } from '@/activities/types/TaskTarget';
import { getActivityTargetObjectRecords } from '@/activities/utils/getActivityTargetObjectRecords';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useOpenFilesFieldInput } from '@/object-record/record-field/ui/meta-types/input/hooks/useOpenFilesFieldInput';
import { useOpenMorphRelationManyToOneFieldInput } from '@/object-record/record-field/ui/meta-types/input/hooks/useOpenMorphRelationManyToOneFieldInput';
import { useOpenMorphRelationOneToManyFieldInput } from '@/object-record/record-field/ui/meta-types/input/hooks/useOpenMorphRelationOneToManyFieldInput';
import { useOpenRelationFromManyFieldInput } from '@/object-record/record-field/ui/meta-types/input/hooks/useOpenRelationFromManyFieldInput';
import { useOpenRelationToOneFieldInput } from '@/object-record/record-field/ui/meta-types/input/hooks/useOpenRelationToOneFieldInput';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import { type FieldDefinition } from '@/object-record/record-field/ui/types/FieldDefinition';
import {
  type FieldMetadata,
  type FieldRelationFromManyValue,
  type FieldRelationValue,
} from '@/object-record/record-field/ui/types/FieldMetadata';
import { isFieldFiles } from '@/object-record/record-field/ui/types/guards/isFieldFiles';
import { isFieldMorphRelation } from '@/object-record/record-field/ui/types/guards/isFieldMorphRelation';
import { isFieldMorphRelationManyToOne } from '@/object-record/record-field/ui/types/guards/isFieldMorphRelationManyToOne';
import { isFieldMorphRelationOneToMany } from '@/object-record/record-field/ui/types/guards/isFieldMorphRelationOneToMany';
import { isFieldRelationManyToOne } from '@/object-record/record-field/ui/types/guards/isFieldRelationManyToOne';
import { isFieldRelationOneToMany } from '@/object-record/record-field/ui/types/guards/isFieldRelationOneToMany';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { usePushFocusItemToFocusStack } from '@/ui/utilities/focus/hooks/usePushFocusItemToFocusStack';
import { useRemoveFocusItemFromFocusStackById } from '@/ui/utilities/focus/hooks/useRemoveFocusItemFromFocusStackById';
import { FocusComponentType } from '@/ui/utilities/focus/types/FocusComponentType';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useCallback } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useStore } from 'jotai';

export const useOpenFieldWidgetFieldInputEditMode = () => {
  const store = useStore();
  const { openRelationToOneFieldInput } = useOpenRelationToOneFieldInput();
  const { openRelationFromManyFieldInput } =
    useOpenRelationFromManyFieldInput();

  const { openMorphRelationOneToManyFieldInput } =
    useOpenMorphRelationOneToManyFieldInput();

  const { openActivityTargetCellEditMode } =
    useOpenActivityTargetCellEditMode();

  const { openMorphRelationManyToOneFieldInput } =
    useOpenMorphRelationManyToOneFieldInput();

  const { openFilesFieldInput } = useOpenFilesFieldInput();

  const { updateOneRecord } = useUpdateOneRecord();

  const { pushFocusItemToFocusStack } = usePushFocusItemToFocusStack();

  const instanceId = useAvailableComponentInstanceIdOrThrow(
    RecordFieldComponentInstanceContext,
  );

  const openFieldInput = useCallback(
    ({
      fieldDefinition,
      recordId,
    }: {
      fieldDefinition: FieldDefinition<FieldMetadata>;
      recordId: string;
    }) => {
      // FILES: an empty field opens the native file picker directly; a non-empty one
      // falls through to the focus push below so the edit portal renders FilesFieldInput
      // (which only renders once there is at least one file to manage).
      if (isFieldFiles(fieldDefinition)) {
        const fieldValue = store.get(
          recordStoreFamilySelector.selectorFamily({
            recordId,
            fieldName: fieldDefinition.metadata.fieldName,
          }),
        ) as unknown[] | undefined;

        const isEmpty = !isDefined(fieldValue) || fieldValue.length === 0;

        if (isEmpty) {
          const objectMetadataItems = store.get(
            objectMetadataItemsSelector.atom,
          );
          const objectMetadataItem = objectMetadataItems.find(
            (item) =>
              item.nameSingular ===
              fieldDefinition.metadata.objectMetadataNameSingular,
          );

          if (isDefined(objectMetadataItem)) {
            openFilesFieldInput({
              fieldName: fieldDefinition.metadata.fieldName,
              fieldMetadataId: fieldDefinition.fieldMetadataId,
              recordId,
              prefix: instanceId,
              updateRecord: (updateInput) =>
                updateOneRecord({
                  objectNameSingular: objectMetadataItem.nameSingular,
                  idToUpdate: recordId,
                  updateOneRecordInput: updateInput,
                }),
              fieldDefinition: {
                metadata: {
                  settings: fieldDefinition.metadata.settings ?? undefined,
                },
              },
            });
            return;
          }
        }
      }

      if (
        isFieldRelationOneToMany(fieldDefinition) &&
        ['taskTarget', 'noteTarget'].includes(
          fieldDefinition.metadata.relationObjectMetadataNameSingular,
        )
      ) {
        const fieldValue = store.get(
          recordStoreFamilySelector.selectorFamily({
            recordId,
            fieldName: fieldDefinition.metadata.fieldName,
          }),
        ) as FieldRelationValue<FieldRelationFromManyValue>;

        const activity = store.get(recordStoreFamilyState.atomFamily(recordId));

        const objectMetadataItems = store.get(objectMetadataItemsSelector.atom);

        const activityTargetObjectRecords = getActivityTargetObjectRecords({
          activityRecord: activity as Task | Note,
          objectMetadataItems,
          activityTargets: fieldValue as NoteTarget[] | TaskTarget[],
        });

        openActivityTargetCellEditMode({
          recordPickerInstanceId: instanceId,
          activityTargetObjectRecords,
        });
        return;
      }

      if (isFieldRelationManyToOne(fieldDefinition)) {
        openRelationToOneFieldInput({
          fieldName: fieldDefinition.metadata.fieldName,
          recordId,
          prefix: instanceId,
        });

        return;
      }

      if (isFieldMorphRelationOneToMany(fieldDefinition)) {
        if (!isFieldMorphRelation(fieldDefinition)) {
          throw new Error('Field is not a morph relation one to many');
        }

        openMorphRelationOneToManyFieldInput({
          recordId,
          prefix: instanceId,
          fieldDefinition,
        });
        return;
      }

      if (isFieldRelationOneToMany(fieldDefinition)) {
        if (
          isDefined(fieldDefinition.metadata.relationObjectMetadataNameSingular)
        ) {
          openRelationFromManyFieldInput({
            fieldName: fieldDefinition.metadata.fieldName,
            objectNameSingular:
              fieldDefinition.metadata.relationObjectMetadataNameSingular,
            recordId,
            prefix: instanceId,
          });
          return;
        }
      }

      if (isFieldMorphRelationManyToOne(fieldDefinition)) {
        openMorphRelationManyToOneFieldInput({
          recordId,
          prefix: instanceId,
          fieldDefinition,
        });
        return;
      }

      pushFocusItemToFocusStack({
        focusId: instanceId,
        component: {
          type: FocusComponentType.OPENED_FIELD_INPUT,
          instanceId: instanceId,
        },
        globalHotkeysConfig: {
          enableGlobalHotkeysConflictingWithKeyboard: false,
        },
      });
    },
    [
      instanceId,
      openActivityTargetCellEditMode,
      openFilesFieldInput,
      openMorphRelationManyToOneFieldInput,
      openMorphRelationOneToManyFieldInput,
      openRelationFromManyFieldInput,
      openRelationToOneFieldInput,
      pushFocusItemToFocusStack,
      store,
      updateOneRecord,
    ],
  );

  const { removeFocusItemFromFocusStackById } =
    useRemoveFocusItemFromFocusStackById();

  const closeFieldInput = () => {
    removeFocusItemFromFocusStackById({
      focusId: instanceId,
    });
  };

  return {
    openFieldInput,
    closeFieldInput,
  };
};
