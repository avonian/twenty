import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Whether the record-wide field objectives side panel is open.
export const fieldObjectivesPanelOpenState = createAtomState<boolean>({
  key: 'fieldObjectivesPanelOpenState',
  defaultValue: false,
});

// The field whose threads should be scrolled into view / highlighted when the
// panel opens from a specific field's objective icon.
export const fieldObjectivesPanelFocusFieldMetadataIdState = createAtomState<
  string | null
>({
  key: 'fieldObjectivesPanelFocusFieldMetadataIdState',
  defaultValue: null,
});

// Set while hovering a field's objective icon on the form; read by the side
// panel to highlight the matching card.
export const fieldObjectivesHoveredFromFormFieldMetadataIdState =
  createAtomState<string | null>({
    key: 'fieldObjectivesHoveredFromFormFieldMetadataIdState',
    defaultValue: null,
  });

// Set while hovering an objective card in the side panel; read by the form to
// highlight (and scroll to) the matching field.
export const fieldObjectivesHoveredFromPanelFieldMetadataIdState =
  createAtomState<string | null>({
    key: 'fieldObjectivesHoveredFromPanelFieldMetadataIdState',
    defaultValue: null,
  });
