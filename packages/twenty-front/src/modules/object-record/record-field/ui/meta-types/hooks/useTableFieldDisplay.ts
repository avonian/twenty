import { useContext } from 'react';

import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { type FieldTableValue } from '@/object-record/record-field/ui/types/FieldMetadata';
import { isFieldTable } from '@/object-record/record-field/ui/types/guards/isFieldTable';
import { useRecordFieldValue } from '@/object-record/record-store/hooks/useRecordFieldValue';

export const useTableFieldDisplay = () => {
  const { recordId, fieldDefinition, isRecordFieldReadOnly } =
    useContext(FieldContext);

  const fieldName = fieldDefinition.metadata.fieldName;

  const fieldValue = useRecordFieldValue<FieldTableValue | undefined>(
    recordId,
    fieldName,
    fieldDefinition,
  );

  const settings = isFieldTable(fieldDefinition)
    ? (fieldDefinition.metadata.settings ?? null)
    : null;

  return {
    fieldDefinition,
    fieldValue: fieldValue ?? null,
    settings,
    isRecordFieldReadOnly,
  };
};
