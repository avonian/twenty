import { type FieldTableValue } from '@/object-record/record-field/ui/types/FieldMetadata';
import { tableFieldValueSchema } from '@/object-record/record-field/ui/validation-schemas/tableFieldValueSchema';

export const isFieldTableValue = (
  fieldValue: unknown,
): fieldValue is FieldTableValue =>
  tableFieldValueSchema.safeParse(fieldValue).success;
