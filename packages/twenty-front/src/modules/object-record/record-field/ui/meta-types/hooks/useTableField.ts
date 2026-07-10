import { useContext } from 'react';

import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { useRecordFieldInput } from '@/object-record/record-field/ui/hooks/useRecordFieldInput';
import { recordFieldInputDraftValueComponentState } from '@/object-record/record-field/ui/states/recordFieldInputDraftValueComponentState';
import { type FieldTableValue } from '@/object-record/record-field/ui/types/FieldMetadata';
import { assertFieldMetadata } from '@/object-record/record-field/ui/types/guards/assertFieldMetadata';
import { isFieldTable } from '@/object-record/record-field/ui/types/guards/isFieldTable';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { FieldMetadataType } from '~/generated-metadata/graphql';

export const useTableField = () => {
  const { recordId, fieldDefinition } = useContext(FieldContext);

  assertFieldMetadata(FieldMetadataType.TABLE, isFieldTable, fieldDefinition);

  const fieldName = fieldDefinition.metadata.fieldName;

  const fieldValue = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName,
  }) as FieldTableValue | undefined;

  const { setDraftValue } = useRecordFieldInput<FieldTableValue>();

  const draftValue = useAtomComponentStateValue(
    recordFieldInputDraftValueComponentState,
  ) as FieldTableValue | undefined;

  return {
    fieldDefinition,
    fieldValue: fieldValue ?? null,
    draftValue: draftValue ?? null,
    setDraftValue,
    settings: fieldDefinition.metadata.settings ?? null,
  };
};
