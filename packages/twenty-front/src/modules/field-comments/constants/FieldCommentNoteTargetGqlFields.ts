// Shared noteTarget selection used by both the per-field and record-wide
// comment thread queries (slice 1 + slice 2). Replies are NOT selected here:
// the record GraphQL generator caps relation depth at 1, so noteTarget -> note
// -> replies (depth 2) would be dropped. Replies are fetched separately via
// useRepliesByRootNoteId.
export const FIELD_COMMENT_NOTE_TARGET_GQL_FIELDS = {
  id: true,
  note: {
    id: true,
    title: true,
    isResolved: true,
    resolvedAt: true,
    createdAt: true,
    createdBy: true,
    parentNoteId: true,
  },
};
