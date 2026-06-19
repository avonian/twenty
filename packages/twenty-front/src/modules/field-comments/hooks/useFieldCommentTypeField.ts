import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { FieldMetadataType } from '~/generated-metadata/graphql';

// Detects an optional, user-defined "Type" SELECT field on the Note object so a
// category can be picked when starting a thread. Default installs have no such
// field, so this returns undefined and the composer simply omits the picker.
export const useFieldCommentTypeField = (): {
  fieldCommentTypeField: FieldMetadataItem | undefined;
} => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Note,
  });

  const fieldCommentTypeField = objectMetadataItem.fields.find(
    (field) =>
      field.isActive === true &&
      field.type === FieldMetadataType.SELECT &&
      (field.name === 'type' || field.label.toLowerCase() === 'type') &&
      isDefined(field.options) &&
      field.options.length > 0,
  );

  return { fieldCommentTypeField };
};
