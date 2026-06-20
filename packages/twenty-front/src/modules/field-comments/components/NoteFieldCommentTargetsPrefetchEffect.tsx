import { CoreObjectNameSingular } from 'twenty-shared/types';

import { IS_FIELD_COMMENTS_ENABLED } from '@/field-comments/constants/IsFieldCommentsEnabled';
import { usePrefetchNoteFieldCommentTargets } from '@/field-comments/hooks/usePrefetchNoteFieldCommentTargets';

type NoteFieldCommentTargetsPrefetchEffectProps = {
  objectNameSingular: string;
};

// Mounted on the record index: when viewing the Notes index, prefetches where
// each field-comment note points so clicking one can jump straight to its
// target record instead of opening the (useless) note itself.
export const NoteFieldCommentTargetsPrefetchEffect = ({
  objectNameSingular,
}: NoteFieldCommentTargetsPrefetchEffectProps) => {
  usePrefetchNoteFieldCommentTargets(
    IS_FIELD_COMMENTS_ENABLED &&
      objectNameSingular === CoreObjectNameSingular.Note,
  );

  return null;
};
