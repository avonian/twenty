import { Module } from '@nestjs/common';

import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';

import { VersioningService } from 'src/modules/versioning/versioning.service';
import { VersionedObjectResolver } from 'src/modules/versioning/resolvers/versioned-object.resolver';

@Module({
  imports: [GlobalWorkspaceDataSourceModule],
  providers: [VersioningService, VersionedObjectResolver],
})
export class VersioningModule {}
