import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Whether the record-wide field comments side panel is open.
export const fieldCommentsPanelOpenState = createAtomState<boolean>({
  key: 'fieldCommentsPanelOpenState',
  defaultValue: false,
});

// The field whose threads should be scrolled into view / highlighted when the
// panel opens from a specific field's comment icon.
export const fieldCommentsPanelFocusFieldMetadataIdState = createAtomState<
  string | null
>({
  key: 'fieldCommentsPanelFocusFieldMetadataIdState',
  defaultValue: null,
});

// Set while hovering a field's comment icon on the form; read by the side panel
// to highlight the matching card. (Does NOT highlight the form field itself.)
export const fieldCommentsHoveredFromFormFieldMetadataIdState = createAtomState<
  string | null
>({
  key: 'fieldCommentsHoveredFromFormFieldMetadataIdState',
  defaultValue: null,
});

// Set while hovering a comment card in the side panel; read by the form to
// highlight (and scroll to) the matching field. (Does NOT highlight the card.)
export const fieldCommentsHoveredFromPanelFieldMetadataIdState =
  createAtomState<string | null>({
    key: 'fieldCommentsHoveredFromPanelFieldMetadataIdState',
    defaultValue: null,
  });
