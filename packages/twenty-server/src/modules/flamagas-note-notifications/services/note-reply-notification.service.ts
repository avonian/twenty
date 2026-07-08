import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { render } from '@react-email/render';
import { NoteReplyNotificationEmail } from 'twenty-emails';
import { In, Repository } from 'typeorm';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';

import { EmailService } from 'src/engine/core-modules/email/email.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';

const NOTE = 'note';
const NOTE_TARGET = 'noteTarget';
const WORKSPACE_MEMBER = 'workspaceMember';
const EMAIL_LOCALE = 'es-ES';
const REPLY_SNIPPET_MAX_LENGTH = 300;

// A note row, reading only the columns this feature needs. `createdBy` is an
// ACTOR composite field, so the ORM returns it nested (createdBy.workspaceMemberId)
// — NOT as flat createdByWorkspaceMemberId columns.
type ActorValue = {
  workspaceMemberId: string | null;
  name: string | null;
} | null;

export type NoteRow = {
  id: string;
  title: string | null;
  parentNoteId: string | null;
  createdBy: ActorValue;
};

type WorkspaceMemberRow = {
  id: string;
  userEmail: string | null;
};

@Injectable()
export class NoteReplyNotificationService {
  private readonly logger = new Logger(NoteReplyNotificationService.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly emailService: EmailService,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  // For each newly-created reply, email every participant of its thread (the
  // root note's owner + everyone who replied) except the reply's own author.
  async notifyForCreatedNotes(workspaceId: string, noteIds: string[]) {
    if (noteIds.length === 0) {
      return;
    }

    const workspace = await this.workspaceRepository.findOneBy({
      id: workspaceId,
    });

    if (!isDefined(workspace)) {
      return;
    }

    const noteRepository =
      await this.globalWorkspaceOrmManager.getRepository<NoteRow>(
        workspaceId,
        NOTE,
        { shouldBypassPermissionChecks: true },
      );

    const memberRepository =
      await this.globalWorkspaceOrmManager.getRepository<WorkspaceMemberRow>(
        workspaceId,
        WORKSPACE_MEMBER,
        { shouldBypassPermissionChecks: true },
      );

    // Re-fetch the created notes so parentNoteId is read from the DB (the event
    // payload doesn't reliably carry the self-relation join column). Keep only
    // replies (notes with a parent).
    const createdNotes = await noteRepository.find({
      where: { id: In(noteIds) },
    });
    const replies = createdNotes.filter((note) =>
      isDefined(note.parentNoteId),
    );

    if (replies.length === 0) {
      return;
    }

    for (const reply of replies) {
      const rootId = reply.parentNoteId;

      if (!isDefined(rootId)) {
        continue;
      }

      const rootNote = await noteRepository.findOne({ where: { id: rootId } });

      if (!isDefined(rootNote)) {
        continue;
      }

      // The whole thread: root owner + every replier.
      const threadReplies = await noteRepository.find({
        where: { parentNoteId: rootId },
      });

      const participantIds = new Set<string>();

      const rootOwnerId = rootNote.createdBy?.workspaceMemberId;
      if (isDefined(rootOwnerId)) {
        participantIds.add(rootOwnerId);
      }
      for (const threadReply of threadReplies) {
        const replierId = threadReply.createdBy?.workspaceMemberId;
        if (isDefined(replierId)) {
          participantIds.add(replierId);
        }
      }

      // Never notify the author of the reply that triggered this send.
      const replyAuthorId = reply.createdBy?.workspaceMemberId;
      if (isDefined(replyAuthorId)) {
        participantIds.delete(replyAuthorId);
      }

      if (participantIds.size === 0) {
        continue;
      }

      const members = await memberRepository.find({
        where: { id: In([...participantIds]) },
      });

      const link = await this.buildThreadLink(workspaceId, workspace, rootId);
      const authorName = reply.createdBy?.name ?? 'Desconocido';
      const noteTitle = rootNote.title ?? '';
      const replyText = this.truncate(reply.title ?? '');

      for (const member of members) {
        if (!isDefined(member.userEmail)) {
          continue;
        }

        await this.sendReplyEmail({
          to: member.userEmail,
          authorName,
          noteTitle,
          replyText,
          link,
        });
      }

      this.logger.log(
        `note-reply notification: emailed ${members.length} participant(s) for thread ${rootId} in workspace ${workspaceId}`,
      );
    }
  }

  // Resolve the root note's target record and point the email at its Notes tab.
  // Falls back to the workspace home if the target can't be resolved.
  private async buildThreadLink(
    workspaceId: string,
    workspace: WorkspaceEntity,
    rootNoteId: string,
  ): Promise<string> {
    try {
      const noteTargetRepository =
        await this.globalWorkspaceOrmManager.getRepository<
          Record<string, string | null>
        >(workspaceId, NOTE_TARGET, { shouldBypassPermissionChecks: true });

      const noteTarget = await noteTargetRepository.findOne({
        where: { noteId: rootNoteId },
      });

      const resolved = isDefined(noteTarget)
        ? this.resolveTargetRecord(noteTarget)
        : null;

      const pathname = isDefined(resolved)
        ? getAppPath(AppPath.RecordShowPage, {
            objectNameSingular: resolved.objectNameSingular,
            objectRecordId: resolved.recordId,
          })
        : '/';

      return this.workspaceDomainsService
        .buildWorkspaceURL({ workspace, pathname })
        .toString();
    } catch {
      return this.workspaceDomainsService
        .buildWorkspaceURL({ workspace, pathname: '/' })
        .toString();
    }
  }

  // Read the first non-null `target<Object>Id` column and turn it into an
  // objectNameSingular (e.g. targetPerformanceRegularId -> performanceRegular).
  private resolveTargetRecord(
    noteTarget: Record<string, string | null>,
  ): { objectNameSingular: string; recordId: string } | null {
    for (const [column, value] of Object.entries(noteTarget)) {
      if (column === 'targetFieldMetadataId' || !isDefined(value)) {
        continue;
      }

      const match = column.match(/^target(.+)Id$/);

      if (isDefined(match)) {
        const objectNameSingular =
          match[1].charAt(0).toLowerCase() + match[1].slice(1);

        return { objectNameSingular, recordId: value };
      }
    }

    return null;
  }

  private truncate(text: string): string {
    return text.length > REPLY_SNIPPET_MAX_LENGTH
      ? `${text.slice(0, REPLY_SNIPPET_MAX_LENGTH)}…`
      : text;
  }

  private async sendReplyEmail({
    to,
    authorName,
    noteTitle,
    replyText,
    link,
  }: {
    to: string;
    authorName: string;
    noteTitle: string;
    replyText: string;
    link: string;
  }) {
    const emailTemplate = NoteReplyNotificationEmail({
      authorName,
      noteTitle,
      replyText,
      link,
      locale: EMAIL_LOCALE,
    });

    const html = await render(emailTemplate, { pretty: true });
    const text = await render(emailTemplate, { plainText: true });

    await this.emailService.send({
      from: `${this.twentyConfigService.get(
        'EMAIL_FROM_NAME',
      )} <${this.twentyConfigService.get('EMAIL_FROM_ADDRESS')}>`,
      to,
      subject: `Nueva respuesta de ${authorName}`,
      text,
      html,
    });
  }
}
