import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('SaveVersionedObjectResult')
export class SaveVersionedObjectResultDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => Int)
  version: number;

  @Field()
  isLatest: boolean;

  @Field(() => UUIDScalarType)
  rootVersionId: string;
}
