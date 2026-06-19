import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FieldCommentReply } from '@/field-comments/types/FieldComment';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

const REPLY_GQL_FIELDS = {
  id: true,
  title: true,
  createdAt: true,
  createdBy: true,
  parentNoteId: true,
};

type ReplyRecord = FieldCommentReply & {
  __typename: string;
  parentNoteId: string | null;
};

// Replies are fetched as their own top-level `note` query rather than via the
// root note's `replies` relation: the record GraphQL generator caps relation
// depth at 1, so noteTarget -> note -> replies (depth 2) is never returned.
export const useRepliesByRootNoteId = (rootNoteIds: string[]) => {
  const { records, loading, refetch } = useFindManyRecords<ReplyRecord>({
    objectNameSingular: CoreObjectNameSingular.Note,
    filter: { parentNoteId: { in: rootNoteIds } },
    orderBy: [{ createdAt: 'AscNullsFirst' }],
    recordGqlFields: REPLY_GQL_FIELDS,
    skip: rootNoteIds.length === 0,
  });

  const repliesByRootNoteId = useMemo(() => {
    const grouped: Record<string, FieldCommentReply[]> = {};

    for (const reply of records) {
      if (!isDefined(reply.parentNoteId)) {
        continue;
      }

      const existing = grouped[reply.parentNoteId] ?? [];
      existing.push(reply);
      grouped[reply.parentNoteId] = existing;
    }

    // Guarantee chronological order (oldest first, newest at bottom) regardless
    // of cache merge order.
    for (const rootNoteId of Object.keys(grouped)) {
      grouped[rootNoteId].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      );
    }

    return grouped;
  }, [records]);

  return { repliesByRootNoteId, loading, refetch };
};
