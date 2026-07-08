import { Module } from '@nestjs/common';

import { CalendarModule } from 'src/modules/calendar/calendar.module';
import { ConnectedAccountModule } from 'src/modules/connected-account/connected-account.module';
import { FlamagasDerivedFieldsModule } from 'src/modules/flamagas-derived-fields/flamagas-derived-fields.module';
import { MessagingModule } from 'src/modules/messaging/messaging.module';
import { FieldCommentNoteLifecycleModule } from 'src/modules/note/field-comment-note-lifecycle.module';
import { WorkflowModule } from 'src/modules/workflow/workflow.module';
import { WorkspaceMemberModule } from 'src/modules/workspace-member/workspace-member.module';

@Module({
  imports: [
    MessagingModule,
    CalendarModule,
    ConnectedAccountModule,
    WorkflowModule,
    WorkspaceMemberModule,
    FieldCommentNoteLifecycleModule,
    FlamagasDerivedFieldsModule,
  ],
  providers: [],
  exports: [],
})
export class ModulesModule {}
