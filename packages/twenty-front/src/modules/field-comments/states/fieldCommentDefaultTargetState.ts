import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Where clicking a field's comment icon opens its threads.
export type FieldCommentDefaultTarget = 'popover' | 'panel';

// Persisted user preference: inline popover (default) or record-wide side panel.
export const fieldCommentDefaultTargetState =
  createAtomState<FieldCommentDefaultTarget>({
    key: 'fieldCommentDefaultTarget',
    defaultValue: 'popover',
    useLocalStorage: true,
  });
