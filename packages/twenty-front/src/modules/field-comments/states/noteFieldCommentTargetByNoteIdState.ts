import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Where a field-comment note points: its anchored record + field. Prefetched
// for the Notes index so clicking such a note can jump straight to the target
// (and open/highlight the thread) instead of opening the note itself.
export type NoteFieldCommentTarget = {
  objectNameSingular: string;
  recordId: string;
  fieldMetadataId: string;
};

export const noteFieldCommentTargetByNoteIdState = createAtomState<
  Record<string, NoteFieldCommentTarget>
>({
  key: 'noteFieldCommentTargetByNoteIdState',
  defaultValue: {},
});
