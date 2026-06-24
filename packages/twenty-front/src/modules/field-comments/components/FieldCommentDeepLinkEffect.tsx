import { isNonEmptyString } from '@sniptt/guards';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FIELD_COMMENT_DEEP_LINK_PARAM } from '@/field-comments/constants/FieldCommentDeepLinkParam';
import {
  fieldCommentsHoveredFromFormFieldMetadataIdState,
  fieldCommentsHoveredFromPanelFieldMetadataIdState,
  fieldCommentsPanelFocusFieldMetadataIdState,
  fieldCommentsPanelOpenState,
} from '@/field-comments/states/fieldCommentsPanelState';
import { fieldObjectivesPanelOpenState } from '@/field-objectives/states/fieldObjectivesPanelState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

// How long the deep-linked thread stays highlighted before fading on its own.
const FIELD_COMMENT_DEEP_LINK_HIGHLIGHT_DURATION_IN_MS = 4000;

// On arrival from a "jump to comment" link, open the field comments side panel
// focused on (and scrolled to) the linked field, and highlight both the panel
// card and the field on the form. The highlight is a one-shot: it fades after a
// few seconds and is cleared on leaving the page, so it never lingers when you
// navigate back. The param is consumed so a refresh doesn't re-trigger it.
export const FieldCommentDeepLinkEffect = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fieldMetadataIdFromUrl = searchParams.get(
    FIELD_COMMENT_DEEP_LINK_PARAM,
  );

  const [highlightedFieldMetadataId, setHighlightedFieldMetadataId] = useState<
    string | null
  >(null);

  const setFieldCommentsPanelOpen = useSetAtomState(
    fieldCommentsPanelOpenState,
  );
  const setFieldCommentsPanelFocusFieldMetadataId = useSetAtomState(
    fieldCommentsPanelFocusFieldMetadataIdState,
  );
  const setFieldCommentsHoveredFromFormFieldMetadataId = useSetAtomState(
    fieldCommentsHoveredFromFormFieldMetadataIdState,
  );
  const setFieldCommentsHoveredFromPanelFieldMetadataId = useSetAtomState(
    fieldCommentsHoveredFromPanelFieldMetadataIdState,
  );
  const setFieldObjectivesPanelOpen = useSetAtomState(
    fieldObjectivesPanelOpenState,
  );

  // Consume the deep-link param once: remember the field, then strip the param
  // so a refresh / back-navigation doesn't re-trigger the highlight.
  useEffect(() => {
    if (!isNonEmptyString(fieldMetadataIdFromUrl)) {
      return;
    }

    setHighlightedFieldMetadataId(fieldMetadataIdFromUrl);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(FIELD_COMMENT_DEEP_LINK_PARAM);
    setSearchParams(nextSearchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldMetadataIdFromUrl]);

  // Open + focus + highlight the thread, then fade the highlight after a delay
  // (and clear it when leaving the page) so it never persists on return.
  useEffect(() => {
    if (!isNonEmptyString(highlightedFieldMetadataId)) {
      return;
    }

    setFieldObjectivesPanelOpen(false);
    setFieldCommentsPanelOpen(true);
    setFieldCommentsPanelFocusFieldMetadataId(highlightedFieldMetadataId);
    // Highlight both sides: the panel card (via the form-hover atom) and the
    // field on the form / its input (via the panel-hover atom, which also
    // scrolls the field into view).
    setFieldCommentsHoveredFromFormFieldMetadataId(highlightedFieldMetadataId);
    setFieldCommentsHoveredFromPanelFieldMetadataId(highlightedFieldMetadataId);

    const clearHighlight = () => {
      setFieldCommentsPanelFocusFieldMetadataId(null);
      setFieldCommentsHoveredFromFormFieldMetadataId(null);
      setFieldCommentsHoveredFromPanelFieldMetadataId(null);
    };

    const timeout = setTimeout(() => {
      clearHighlight();
      setHighlightedFieldMetadataId(null);
    }, FIELD_COMMENT_DEEP_LINK_HIGHLIGHT_DURATION_IN_MS);

    return () => {
      clearTimeout(timeout);
      clearHighlight();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedFieldMetadataId]);

  return null;
};
