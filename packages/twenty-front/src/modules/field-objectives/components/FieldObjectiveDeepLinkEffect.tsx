import { isNonEmptyString } from '@sniptt/guards';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { fieldCommentsPanelOpenState } from '@/field-comments/states/fieldCommentsPanelState';
import { FIELD_OBJECTIVE_DEEP_LINK_PARAM } from '@/field-objectives/constants/FieldObjectiveDeepLinkParam';
import {
  fieldObjectivesHoveredFromFormFieldMetadataIdState,
  fieldObjectivesHoveredFromPanelFieldMetadataIdState,
  fieldObjectivesPanelFocusFieldMetadataIdState,
  fieldObjectivesPanelOpenState,
} from '@/field-objectives/states/fieldObjectivesPanelState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

// How long the deep-linked thread stays highlighted before fading on its own.
const FIELD_OBJECTIVE_DEEP_LINK_HIGHLIGHT_DURATION_IN_MS = 4000;

// On arrival from a "jump to objective" link, open the field objectives side
// panel focused on (and scrolled to) the linked field, and highlight both the
// panel card and the field on the form. One-shot: fades after a few seconds and
// clears on leaving. The param is consumed so a refresh doesn't re-trigger it.
export const FieldObjectiveDeepLinkEffect = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fieldMetadataIdFromUrl = searchParams.get(
    FIELD_OBJECTIVE_DEEP_LINK_PARAM,
  );

  const [highlightedFieldMetadataId, setHighlightedFieldMetadataId] = useState<
    string | null
  >(null);

  const setFieldObjectivesPanelOpen = useSetAtomState(
    fieldObjectivesPanelOpenState,
  );
  const setFieldCommentsPanelOpen = useSetAtomState(
    fieldCommentsPanelOpenState,
  );
  const setFieldObjectivesPanelFocusFieldMetadataId = useSetAtomState(
    fieldObjectivesPanelFocusFieldMetadataIdState,
  );
  const setFieldObjectivesHoveredFromFormFieldMetadataId = useSetAtomState(
    fieldObjectivesHoveredFromFormFieldMetadataIdState,
  );
  const setFieldObjectivesHoveredFromPanelFieldMetadataId = useSetAtomState(
    fieldObjectivesHoveredFromPanelFieldMetadataIdState,
  );

  useEffect(() => {
    if (!isNonEmptyString(fieldMetadataIdFromUrl)) {
      return;
    }

    setHighlightedFieldMetadataId(fieldMetadataIdFromUrl);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(FIELD_OBJECTIVE_DEEP_LINK_PARAM);
    setSearchParams(nextSearchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldMetadataIdFromUrl]);

  useEffect(() => {
    if (!isNonEmptyString(highlightedFieldMetadataId)) {
      return;
    }

    setFieldCommentsPanelOpen(false);
    setFieldObjectivesPanelOpen(true);
    setFieldObjectivesPanelFocusFieldMetadataId(highlightedFieldMetadataId);
    setFieldObjectivesHoveredFromFormFieldMetadataId(
      highlightedFieldMetadataId,
    );
    setFieldObjectivesHoveredFromPanelFieldMetadataId(
      highlightedFieldMetadataId,
    );

    const clearHighlight = () => {
      setFieldObjectivesPanelFocusFieldMetadataId(null);
      setFieldObjectivesHoveredFromFormFieldMetadataId(null);
      setFieldObjectivesHoveredFromPanelFieldMetadataId(null);
    };

    const timeout = setTimeout(() => {
      clearHighlight();
      setHighlightedFieldMetadataId(null);
    }, FIELD_OBJECTIVE_DEEP_LINK_HIGHLIGHT_DURATION_IN_MS);

    return () => {
      clearTimeout(timeout);
      clearHighlight();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedFieldMetadataId]);

  return null;
};
