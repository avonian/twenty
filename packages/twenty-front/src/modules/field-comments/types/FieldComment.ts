import { type FieldActorValue } from '@/object-record/record-field/ui/types/FieldMetadata';

// A note used as a comment. Text lives in `title` for slice 1 (no rich text yet).
export type FieldCommentNote = {
  id: string;
  title: string;
  isResolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  createdBy: FieldActorValue;
  parentNoteId: string | null;
};

// A reply note (subset of fields fetched via the parent note's `replies`).
export type FieldCommentReply = {
  id: string;
  title: string;
  createdAt: string;
  createdBy: FieldActorValue;
};

// A root comment together with its replies forms a thread.
export type FieldCommentThread = FieldCommentNote & {
  replies: FieldCommentReply[];
};

// Shape of a noteTarget row that anchors a root comment to a (record, field).
export type FieldCommentNoteTarget = {
  __typename: string;
  id: string;
  note: FieldCommentThread;
};

// Same as above, but for the record-wide view where the field is not fixed and
// must be read off each row.
export type FieldCommentRecordNoteTarget = FieldCommentNoteTarget & {
  targetFieldMetadataId: string | null;
};

// One field's threads in the record-wide side panel.
export type FieldCommentFieldGroup = {
  fieldMetadataId: string;
  fieldLabel: string;
  threads: FieldCommentThread[];
};
