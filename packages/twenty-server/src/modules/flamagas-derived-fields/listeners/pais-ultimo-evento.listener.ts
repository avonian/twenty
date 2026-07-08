import { Injectable, Logger } from '@nestjs/common';

import {
  type ObjectRecordCreateEvent,
  type ObjectRecordDeleteEvent,
  type ObjectRecordDestroyEvent,
  type ObjectRecordRestoreEvent,
  type ObjectRecordUpdateEvent,
} from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';

// First derivation of the Flamagas "orange field" auto-fetch: keep
// pais.ultimoEvento in sync with the latest event of that country. Until a
// generic derivation engine exists, orange fields are kept read-computed here
// rather than hand-edited. Reacts to every evento mutation and recomputes the
// affected country/countries.
//
// The event's date is taken from fechaFin (the event's end date). Change
// EVENTO_DATE_FIELD if the "last event" should key off a different date.
const EVENTO = 'evento';
const PAIS = 'pais';
const EVENTO_DATE_FIELD = 'fechaFin';

type EventoRow = {
  id: string;
  paisId: string | null;
  fechaFin: string | null;
};

type PaisRow = {
  id: string;
  ultimoEvento: string | null;
};

type EventoChangeEvent =
  | ObjectRecordCreateEvent<EventoRow>
  | ObjectRecordUpdateEvent<EventoRow>
  | ObjectRecordDeleteEvent<EventoRow>
  | ObjectRecordRestoreEvent<EventoRow>
  | ObjectRecordDestroyEvent<EventoRow>;

@Injectable()
export class PaisUltimoEventoListener {
  private readonly logger = new Logger(PaisUltimoEventoListener.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  @OnDatabaseBatchEvent(EVENTO, DatabaseEventAction.CREATED)
  async handleCreated(payload: WorkspaceEventBatch<ObjectRecordCreateEvent>) {
    await this.recompute(payload as WorkspaceEventBatch<EventoChangeEvent>);
  }

  @OnDatabaseBatchEvent(EVENTO, DatabaseEventAction.UPDATED)
  async handleUpdated(payload: WorkspaceEventBatch<ObjectRecordUpdateEvent>) {
    await this.recompute(payload as WorkspaceEventBatch<EventoChangeEvent>);
  }

  @OnDatabaseBatchEvent(EVENTO, DatabaseEventAction.DELETED)
  async handleDeleted(payload: WorkspaceEventBatch<ObjectRecordDeleteEvent>) {
    await this.recompute(payload as WorkspaceEventBatch<EventoChangeEvent>);
  }

  @OnDatabaseBatchEvent(EVENTO, DatabaseEventAction.RESTORED)
  async handleRestored(payload: WorkspaceEventBatch<ObjectRecordRestoreEvent>) {
    await this.recompute(payload as WorkspaceEventBatch<EventoChangeEvent>);
  }

  @OnDatabaseBatchEvent(EVENTO, DatabaseEventAction.DESTROYED)
  async handleDestroyed(
    payload: WorkspaceEventBatch<ObjectRecordDestroyEvent>,
  ) {
    await this.recompute(payload as WorkspaceEventBatch<EventoChangeEvent>);
  }

  private async recompute(payload: WorkspaceEventBatch<EventoChangeEvent>) {
    const { workspaceId } = payload;

    // An update can move an evento between countries, so both the previous and
    // the new país must be recomputed.
    const paisIds = new Set<string>();

    for (const event of payload.events) {
      // Event union types before/after per action (create has only after,
      // destroy only before); read both through a common optional shape.
      const { before, after } = event.properties as {
        before?: EventoRow;
        after?: EventoRow;
      };

      if (isDefined(before?.paisId)) paisIds.add(before.paisId);
      if (isDefined(after?.paisId)) paisIds.add(after.paisId);
    }

    if (paisIds.size === 0) {
      return;
    }

    const eventoRepository =
      await this.globalWorkspaceOrmManager.getRepository<EventoRow>(
        workspaceId,
        EVENTO,
        // Background handler — no authenticated role context.
        { shouldBypassPermissionChecks: true },
      );

    const paisRepository =
      await this.globalWorkspaceOrmManager.getRepository<PaisRow>(
        workspaceId,
        PAIS,
        { shouldBypassPermissionChecks: true },
      );

    for (const paisId of paisIds) {
      // Non-deleted events only (find excludes soft-deleted by default), so a
      // trashed event stops counting toward the country's last-event date.
      const eventos = await eventoRepository.find({
        where: { paisId },
      });

      const latest = eventos.reduce<string | null>((max, evento) => {
        const value = evento[EVENTO_DATE_FIELD];

        if (!isDefined(value)) return max;

        return !isDefined(max) || value > max ? value : max;
      }, null);

      await paisRepository.update(paisId, { ultimoEvento: latest });
    }

    this.logger.log(
      `recomputed ultimoEvento for ${paisIds.size} país record(s) in workspace ${workspaceId}`,
    );
  }
}
