import { Injectable, Logger } from '@nestjs/common';

import { type ObjectRecordCreateEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  type NoteRow,
  NoteReplyNotificationService,
} from 'src/modules/flamagas-note-notifications/services/note-reply-notification.service';

const NOTE = 'note';
const NOTE_TARGET = 'noteTarget';

// Flamagas: emails on note activity. Two triggers:
// - note CREATED -> a reply was added: notify thread participants + the record
//   owner, minus the reply author.
// - noteTarget CREATED -> a first note was attached to a record: notify that
//   record's owner (the object's initial creator), minus the note author.
// A first note can't use the note-CREATED path because its noteTarget doesn't
// exist yet at that point (separate later mutation). Never throws: a
// notification failure must not break note creation.
@Injectable()
export class NoteReplyNotificationListener {
  private readonly logger = new Logger(NoteReplyNotificationListener.name);

  constructor(
    private readonly noteReplyNotificationService: NoteReplyNotificationService,
  ) {}

  @OnDatabaseBatchEvent(NOTE, DatabaseEventAction.CREATED)
  async handleNoteCreated(
    payload: WorkspaceEventBatch<ObjectRecordCreateEvent<NoteRow>>,
  ) {
    // Pass the created note ids on; the service re-fetches them from the DB to
    // read parentNoteId reliably (the event payload doesn't always carry the
    // self-relation join column).
    const noteIds = payload.events
      .map((event) => event.properties.after?.id)
      .filter(isDefined);

    if (noteIds.length === 0) {
      return;
    }

    try {
      await this.noteReplyNotificationService.notifyForCreatedNotes(
        payload.workspaceId,
        noteIds,
      );
    } catch (error) {
      this.logger.error(
        `note-reply notification failed for workspace ${payload.workspaceId}: ${error}`,
      );
    }
  }

  @OnDatabaseBatchEvent(NOTE_TARGET, DatabaseEventAction.CREATED)
  async handleNoteTargetCreated(
    payload: WorkspaceEventBatch<ObjectRecordCreateEvent<{ id: string }>>,
  ) {
    const noteTargetIds = payload.events
      .map((event) => event.properties.after?.id)
      .filter(isDefined);

    if (noteTargetIds.length === 0) {
      return;
    }

    try {
      await this.noteReplyNotificationService.notifyOwnerForCreatedNoteTargets(
        payload.workspaceId,
        noteTargetIds,
      );
    } catch (error) {
      this.logger.error(
        `note owner notification failed for workspace ${payload.workspaceId}: ${error}`,
      );
    }
  }
}
