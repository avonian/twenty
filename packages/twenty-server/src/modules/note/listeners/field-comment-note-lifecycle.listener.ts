import { Injectable, Logger } from '@nestjs/common';

import { type FindOptionsWhere, In, IsNull, Not } from 'typeorm';

import {
  type ObjectRecordDeleteEvent,
  type ObjectRecordDestroyEvent,
  type ObjectRecordRestoreEvent,
} from 'twenty-shared/database-events';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { capitalize, isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { type NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { type NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';

// Field comments are notes anchored to a record's field via a noteTarget. They
// only make sense in that record's context, so they follow the record's
// lifecycle: trashing/restoring a record trashes/restores its field-comment
// notes (and their replies), and permanently deleting a record purges them.
// Regular notes (no targetFieldMetadataId) are shared and left untouched.
@Injectable()
export class FieldCommentNoteLifecycleListener {
  private readonly logger = new Logger(FieldCommentNoteLifecycleListener.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  // Soft delete (trash) the field-comment notes for the records being trashed.
  // The noteTarget junctions are untouched by a soft delete, so we find them by
  // their still-present target id.
  @OnDatabaseBatchEvent('*', DatabaseEventAction.DELETED)
  async handleDeleted(payload: WorkspaceEventBatch<ObjectRecordDeleteEvent>) {
    await this.softDeleteOrRestoreAnchoredNotes(
      payload,
      DatabaseEventAction.DELETED,
    );
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.RESTORED)
  async handleRestored(payload: WorkspaceEventBatch<ObjectRecordRestoreEvent>) {
    await this.softDeleteOrRestoreAnchoredNotes(
      payload,
      DatabaseEventAction.RESTORED,
    );
  }

  // A permanent delete removes/nulls the noteTarget's target column at the DB
  // level (CASCADE for standard objects, SET NULL for custom ones) before this
  // event fires, so the junction can no longer be matched by target id. Instead
  // we purge field-comment junctions that have become dangling (their anchor is
  // set but every polymorphic target is now null).
  @OnDatabaseBatchEvent('*', DatabaseEventAction.DESTROYED)
  async handleDestroyed(
    payload: WorkspaceEventBatch<ObjectRecordDestroyEvent>,
  ) {
    await this.purgeDanglingFieldCommentNotes(payload);
  }

  private async softDeleteOrRestoreAnchoredNotes(
    payload: WorkspaceEventBatch<
      ObjectRecordDeleteEvent | ObjectRecordRestoreEvent
    >,
    action: DatabaseEventAction.DELETED | DatabaseEventAction.RESTORED,
  ) {
    const { workspaceId, objectMetadata } = payload;
    const objectNameSingular = objectMetadata.nameSingular;

    if (this.isNoteRelatedObject(objectNameSingular)) {
      return;
    }

    const recordIds = payload.events
      .map((event) => event.recordId)
      .filter(isDefined);

    if (recordIds.length === 0) {
      return;
    }

    const noteTargetRepository =
      await this.globalWorkspaceOrmManager.getRepository<NoteTargetWorkspaceEntity>(
        workspaceId,
        CoreObjectNameSingular.NoteTarget,
        // Background event handler — no authenticated role context.
        { shouldBypassPermissionChecks: true },
      );

    // The polymorphic target lives in per-object join columns (e.g.
    // targetCompanyId). If noteTarget can't target this object the column won't
    // exist, so there's nothing anchored to clean up.
    const targetJoinColumnName = `target${capitalize(objectNameSingular)}Id`;

    const hasTargetJoinColumn = noteTargetRepository.metadata.columns.some(
      (column) => column.propertyName === targetJoinColumnName,
    );

    if (!hasTargetJoinColumn) {
      return;
    }

    const fieldCommentNoteTargets = await noteTargetRepository.find({
      where: {
        [targetJoinColumnName]: In(recordIds),
        targetFieldMetadataId: Not(IsNull()),
      } as FindOptionsWhere<NoteTargetWorkspaceEntity>,
      withDeleted: true,
    });

    const rootNoteIds = fieldCommentNoteTargets
      .map((noteTarget) => noteTarget.noteId)
      .filter(isDefined);

    if (rootNoteIds.length === 0) {
      return;
    }

    const noteRepository = await this.getNoteRepository(workspaceId);
    const noteIds = await this.withReplyIds(noteRepository, rootNoteIds);

    if (action === DatabaseEventAction.DELETED) {
      await noteRepository.softDelete(noteIds);
    } else {
      await noteRepository.restore(noteIds);
    }

    this.logger.log(
      `${action} ${noteIds.length} field-comment note(s) for ${recordIds.length} ${objectNameSingular} record(s) in workspace ${workspaceId}`,
    );
  }

  private async purgeDanglingFieldCommentNotes(
    payload: WorkspaceEventBatch<ObjectRecordDestroyEvent>,
  ) {
    const { workspaceId, objectMetadata } = payload;

    if (this.isNoteRelatedObject(objectMetadata.nameSingular)) {
      return;
    }

    const noteTargetRepository =
      await this.globalWorkspaceOrmManager.getRepository<NoteTargetWorkspaceEntity>(
        workspaceId,
        CoreObjectNameSingular.NoteTarget,
        { shouldBypassPermissionChecks: true },
      );

    // Every polymorphic target join column (targetCompanyId, targetXId, ...),
    // excluding the field anchor itself.
    const targetJoinColumnNames = noteTargetRepository.metadata.columns
      .map((column) => column.propertyName)
      .filter(
        (propertyName) =>
          propertyName.startsWith('target') &&
          propertyName.endsWith('Id') &&
          propertyName !== 'targetFieldMetadataId',
      );

    if (targetJoinColumnNames.length === 0) {
      return;
    }

    // Dangling field comment: anchored to a field, but every target is null —
    // i.e. its target record was permanently deleted.
    const danglingWhere: Record<string, unknown> = {
      targetFieldMetadataId: Not(IsNull()),
    };

    for (const targetJoinColumnName of targetJoinColumnNames) {
      danglingWhere[targetJoinColumnName] = IsNull();
    }

    const danglingNoteTargets = await noteTargetRepository.find({
      where: danglingWhere as FindOptionsWhere<NoteTargetWorkspaceEntity>,
      withDeleted: true,
    });

    if (danglingNoteTargets.length === 0) {
      return;
    }

    const rootNoteIds = danglingNoteTargets
      .map((noteTarget) => noteTarget.noteId)
      .filter(isDefined);

    const noteRepository = await this.getNoteRepository(workspaceId);
    const noteIdsToDelete = await this.withReplyIds(
      noteRepository,
      rootNoteIds,
    );

    if (noteIdsToDelete.length > 0) {
      await noteRepository.delete(noteIdsToDelete);
    }

    await noteTargetRepository.delete(
      danglingNoteTargets.map((noteTarget) => noteTarget.id),
    );

    this.logger.log(
      `purged ${noteIdsToDelete.length} dangling field-comment note(s) and ${danglingNoteTargets.length} junction(s) in workspace ${workspaceId}`,
    );
  }

  private isNoteRelatedObject(objectNameSingular: string): boolean {
    // Skipping note/noteTarget also avoids reacting to our own cascade writes.
    return (
      objectNameSingular === CoreObjectNameSingular.Note ||
      objectNameSingular === CoreObjectNameSingular.NoteTarget
    );
  }

  private async getNoteRepository(workspaceId: string) {
    return this.globalWorkspaceOrmManager.getRepository<NoteWorkspaceEntity>(
      workspaceId,
      CoreObjectNameSingular.Note,
      { shouldBypassPermissionChecks: true },
    );
  }

  // Replies point at their root via parentNote (SET_NULL, so not cascaded) —
  // include them so a thread is removed/restored as a whole.
  private async withReplyIds(
    noteRepository: Awaited<ReturnType<typeof this.getNoteRepository>>,
    rootNoteIds: string[],
  ): Promise<string[]> {
    if (rootNoteIds.length === 0) {
      return [];
    }

    const replyNotes = await noteRepository.find({
      where: { parentNoteId: In(rootNoteIds) },
      withDeleted: true,
    });

    return [
      ...new Set([
        ...rootNoteIds,
        ...replyNotes.map((note) => note.id).filter(isDefined),
      ]),
    ];
  }
}
