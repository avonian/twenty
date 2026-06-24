// Notes and Objectives share the underlying `note` object, separated by the
// `bucket` SELECT field. A null/'NOTE' value is a comment; 'OBJECTIVE' is an
// objective. Threads (replies), Type, resolve, and field-anchoring all work
// identically for both buckets.
export const NOTE_BUCKET = {
  NOTE: 'NOTE',
  OBJECTIVE: 'OBJECTIVE',
} as const;

export type NoteBucketValue = (typeof NOTE_BUCKET)[keyof typeof NOTE_BUCKET];
