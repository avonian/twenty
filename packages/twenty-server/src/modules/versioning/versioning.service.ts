import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { ObjectRecord } from 'twenty-shared/types';
import { v4 } from 'uuid';
import { QueryFailedError } from 'typeorm';

import { buildSystemAuthContext } from 'src/engine/core-modules/auth/utils/build-system-auth-context.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

import { SaveVersionedObjectResultDTO } from 'src/modules/versioning/dtos/save-versioned-object-result.dto';

@Injectable()
export class VersioningService {
  private readonly logger = new Logger(VersioningService.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async saveVersion(
    workspace: WorkspaceEntity,
    objectNameSingular: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<SaveVersionedObjectResultDTO> {
    const authContext = buildSystemAuthContext({
      workspace: workspace as any,
    });

    return await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const repo = await this.globalWorkspaceOrmManager.getRepository<
          ObjectRecord & {
            version: number;
            isLatest: boolean;
            previousVersionId?: string | null;
            rootVersionId: string;
          }
        >(workspace.id, objectNameSingular, {
          shouldBypassPermissionChecks: true,
        });

        const current = await repo.findOneBy({ id });

        if (!current) {
          throw new NotFoundException(
            `Record ${id} not found for object ${objectNameSingular}`,
          );
        }

        await repo.update(id, { isLatest: false } as any);

        const generatedColumnNames = new Set(
          repo.metadata.columns
            .filter((col) => col.type === 'tsvector')
            .map((col) => col.databaseName),
        );

        const currentWithoutGenerated = Object.fromEntries(
          Object.entries(current).filter(
            ([key]) => !generatedColumnNames.has(key),
          ),
        );

        try {
          const newRecord = await repo.save({
            ...currentWithoutGenerated,
            ...data,
            id: v4(),
            version: current.version + 1,
            isLatest: true,
            previousVersionId: id,
            rootVersionId: current.rootVersionId || id,
            updatedAt: new Date(),
          } as any);

          return {
            id: newRecord.id,
            version: newRecord.version,
            isLatest: true,
            rootVersionId: newRecord.rootVersionId,
          };
        } catch (error) {
          if (error instanceof QueryFailedError) {
            this.logger.error(
              `PostgreSQL error [code: ${(error as any).code}] saving versioned object: ${error.message}`,
              error.stack,
            );
          } else {
            this.logger.error(
              `Error saving versioned object: ${error}`,
              error instanceof Error ? error.stack : undefined,
            );
          }

          throw error;
        }
      },
      authContext,
    );
  }
}
