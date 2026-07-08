import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceDomainsModule } from 'src/engine/core-modules/domain/workspace-domains/workspace-domains.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceDataSourceModule } from 'src/engine/workspace-datasource/workspace-datasource.module';
import { NoteReplyNotificationListener } from 'src/modules/flamagas-note-notifications/listeners/note-reply-notification.listener';
import { NoteReplyNotificationService } from 'src/modules/flamagas-note-notifications/services/note-reply-notification.service';

// Flamagas: email notifications when a note thread gets a new reply. EmailModule
// (EmailService) and TwentyConfigModule are global, so they need no import here.
@Module({
  imports: [
    WorkspaceDataSourceModule,
    WorkspaceDomainsModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
  ],
  providers: [NoteReplyNotificationListener, NoteReplyNotificationService],
})
export class FlamagasNoteNotificationsModule {}
