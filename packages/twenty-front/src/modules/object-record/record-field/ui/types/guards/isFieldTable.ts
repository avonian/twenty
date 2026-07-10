import { FieldMetadataType } from '~/generated-metadata/graphql';

import { type FieldDefinition } from '@/object-record/record-field/ui/types/FieldDefinition';
import {
  type FieldMetadata,
  type FieldTableMetadata,
} from '@/object-record/record-field/ui/types/FieldMetadata';

export const isFieldTable = (
  field: Pick<FieldDefinition<FieldMetadata>, 'type'>,
): field is FieldDefinition<FieldTableMetadata> =>
  field.type === FieldMetadataType.TABLE;
