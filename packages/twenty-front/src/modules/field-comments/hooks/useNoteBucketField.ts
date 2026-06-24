import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { FieldMetadataType } from '~/generated-metadata/graphql';

// Detects the "Bucket" SELECT field on the Note object that separates comments
// (null/'NOTE') from objectives ('OBJECTIVE'). Mirrors useFieldCommentTypeField:
// when absent (default installs), returns undefined and everything is treated
// as a comment.
export const useNoteBucketField = (): {
  noteBucketField: FieldMetadataItem | undefined;
} => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Note,
  });

  const noteBucketField = objectMetadataItem.fields.find(
    (field) =>
      field.isActive === true &&
      field.type === FieldMetadataType.SELECT &&
      (field.name === 'bucket' || field.label.toLowerCase() === 'bucket') &&
      isDefined(field.options) &&
      field.options.length > 0,
  );

  return { noteBucketField };
};
