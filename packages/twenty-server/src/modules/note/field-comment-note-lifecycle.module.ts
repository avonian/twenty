import { Module } from '@nestjs/common';

import { WorkspaceDataSourceModule } from 'src/engine/workspace-datasource/workspace-datasource.module';
import { FieldCommentNoteLifecycleListener } from 'src/modules/note/listeners/field-comment-note-lifecycle.listener';

@Module({
  imports: [WorkspaceDataSourceModule],
  providers: [FieldCommentNoteLifecycleListener],
})
export class FieldCommentNoteLifecycleModule {}
