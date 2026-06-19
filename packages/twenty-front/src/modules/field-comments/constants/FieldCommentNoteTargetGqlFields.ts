import { isDefined } from 'twenty-shared/utils';

// Shared noteTarget selection used by both the per-field and record-wide
// comment thread queries (slice 1 + slice 2). Replies are NOT selected here:
// the record GraphQL generator caps relation depth at 1, so noteTarget -> note
// -> replies (depth 2) would be dropped. Replies are fetched separately via
// useRepliesByRootNoteId.
//
// When the Note object has an optional "Type" SELECT field, its name is passed
// in so the value is fetched alongside the root note for display on the tile.
export const getFieldCommentNoteTargetGqlFields = (typeFieldName?: string) => ({
  id: true,
  note: {
    id: true,
    title: true,
    isResolved: true,
    resolvedAt: true,
    createdAt: true,
    createdBy: true,
    parentNoteId: true,
    ...(isDefined(typeFieldName) ? { [typeFieldName]: true } : {}),
  },
});
