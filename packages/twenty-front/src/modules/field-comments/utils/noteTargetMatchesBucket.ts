import {
  NOTE_BUCKET,
  type NoteBucketValue,
} from '@/field-comments/constants/NoteBucket';

// Keeps a noteTarget when its note belongs to the requested bucket. Objectives
// match only an explicit 'OBJECTIVE'; comments match everything else (null or
// 'NOTE') so pre-existing notes (created before the bucket field) stay comments.
export const noteTargetMatchesBucket = (
  noteTarget: { note?: Record<string, unknown> | null },
  bucketFieldName: string | undefined,
  bucket: NoteBucketValue,
): boolean => {
  const value =
    bucketFieldName !== undefined
      ? (noteTarget.note?.[bucketFieldName] ?? null)
      : null;

  return bucket === NOTE_BUCKET.OBJECTIVE
    ? value === NOTE_BUCKET.OBJECTIVE
    : value !== NOTE_BUCKET.OBJECTIVE;
};
