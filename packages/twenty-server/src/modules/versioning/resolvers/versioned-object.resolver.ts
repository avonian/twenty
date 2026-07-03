import { UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

import { VersioningService } from 'src/modules/versioning/versioning.service';
import { SaveVersionedObjectResultDTO } from 'src/modules/versioning/dtos/save-versioned-object-result.dto';

@CoreResolver()
@UseGuards(WorkspaceAuthGuard)
export class VersionedObjectResolver {
  constructor(private readonly versioningService: VersioningService) {}

  @Mutation(() => SaveVersionedObjectResultDTO)
  async saveVersionedObject(
    @Args('objectNameSingular') objectNameSingular: string,
    @Args('id', { type: () => UUIDScalarType }) id: string,
    @Args('data', { type: () => GraphQLJSON }) data: Record<string, unknown>,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SaveVersionedObjectResultDTO> {
    return await this.versioningService.saveVersion(
      workspace,
      objectNameSingular,
      id,
      data,
    );
  }
}
