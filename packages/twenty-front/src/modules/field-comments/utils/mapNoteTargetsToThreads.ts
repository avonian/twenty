import { isDefined } from 'twenty-shared/utils';

import {
  type FieldCommentNoteTarget,
  type FieldCommentReply,
  type FieldCommentThread,
} from '@/field-comments/types/FieldComment';

// Nested to-many relations (note.replies) come back as Apollo connections
// ({ edges: [{ node }] }), not plain arrays — unwrap them defensively so the
// thread always exposes replies as an array.
const unwrapReplies = (replies: unknown): FieldCommentReply[] => {
  if (!isDefined(replies)) {
    return [];
  }

  if (Array.isArray(replies)) {
    return replies as FieldCommentReply[];
  }

  const edges = (replies as { edges?: { node: FieldCommentReply }[] }).edges;

  if (Array.isArray(edges)) {
    return edges.map((edge) => edge.node);
  }

  return [];
};

// Each noteTarget anchors one root comment; the root note's `replies` is the
// thread. Shared by the per-field and record-wide hooks.
export const mapNoteTargetsToThreads = (
  noteTargets: FieldCommentNoteTarget[],
): FieldCommentThread[] =>
  noteTargets
    .map((noteTarget) => noteTarget.note)
    .filter(isDefined)
    .map((note) => ({
      ...note,
      replies: unwrapReplies((note as { replies?: unknown }).replies),
    }));
