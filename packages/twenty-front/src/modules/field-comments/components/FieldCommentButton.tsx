import { styled } from '@linaria/react';
import { useContext, useEffect } from 'react';
import { IconMessage } from 'twenty-ui-deprecated/display';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';
import { isDefined } from 'twenty-shared/utils';

import { FieldCommentPopover } from '@/field-comments/components/FieldCommentPopover';
import { useRecordFieldCommentThreads } from '@/field-comments/hooks/useRecordFieldCommentThreads';
import { fieldCommentDefaultTargetState } from '@/field-comments/states/fieldCommentDefaultTargetState';
import {
  fieldCommentsHoveredFromFormFieldMetadataIdState,
  fieldCommentsHoveredFromPanelFieldMetadataIdState,
  fieldCommentsPanelFocusFieldMetadataIdState,
  fieldCommentsPanelOpenState,
} from '@/field-comments/states/fieldCommentsPanelState';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledButton = styled.button<{ hasComments: boolean }>`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ hasComments }) =>
    hasComments
      ? themeCssVariables.color.blue
      : themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  gap: 2px;
  height: 20px;
  padding: 0 ${themeCssVariables.spacing[1]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledCount = styled.span`
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

type FieldCommentButtonProps = {
  isHovered: boolean;
};

export const FieldCommentButton = ({ isHovered }: FieldCommentButtonProps) => {
  const { recordId, fieldDefinition, anchorId } = useContext(FieldContext);
  const { objectMetadataItems } = useObjectMetadataItems();

  const fieldCommentDefaultTarget = useAtomStateValue(
    fieldCommentDefaultTargetState,
  );
  const setFieldCommentsPanelOpen = useSetAtomState(
    fieldCommentsPanelOpenState,
  );
  const setFieldCommentsPanelFocusFieldMetadataId = useSetAtomState(
    fieldCommentsPanelFocusFieldMetadataIdState,
  );
  const fieldCommentsHoveredFromPanelFieldMetadataId = useAtomStateValue(
    fieldCommentsHoveredFromPanelFieldMetadataIdState,
  );
  const setFieldCommentsHoveredFromFormFieldMetadataId = useSetAtomState(
    fieldCommentsHoveredFromFormFieldMetadataIdState,
  );

  const fieldMetadataId = fieldDefinition?.fieldMetadataId;

  // Highlight + scroll this field only when its card is hovered in the panel —
  // not when its own icon is hovered (the cursor is already there).
  const isHighlightedFromPanel =
    isDefined(fieldMetadataId) &&
    fieldCommentsHoveredFromPanelFieldMetadataId === fieldMetadataId;

  useEffect(() => {
    if (!isHighlightedFromPanel || !isDefined(anchorId)) {
      return;
    }

    const element = document.getElementById(anchorId);

    if (!isDefined(element)) {
      return;
    }

    const previousBackgroundColor = element.style.backgroundColor;
    const previousBorderRadius = element.style.borderRadius;

    element.style.backgroundColor = themeCssVariables.color.yellow3;
    element.style.borderRadius = themeCssVariables.border.radius.sm;
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    return () => {
      element.style.backgroundColor = previousBackgroundColor;
      element.style.borderRadius = previousBorderRadius;
    };
  }, [isHighlightedFromPanel, anchorId]);

  // Hovering the field's comment icon highlights the matching card in the panel.
  const handleMouseEnter = () => {
    if (isDefined(fieldMetadataId)) {
      setFieldCommentsHoveredFromFormFieldMetadataId(fieldMetadataId);
    }
  };
  const handleMouseLeave = () =>
    setFieldCommentsHoveredFromFormFieldMetadataId(null);

  // Resolve the owning object's nameSingular from the field metadata.
  const objectNameSingular =
    fieldDefinition?.metadata?.objectMetadataNameSingular ??
    objectMetadataItems.find((objectMetadataItem) =>
      objectMetadataItem.fields.some((field) => field.id === fieldMetadataId),
    )?.nameSingular;

  // Count is derived from a single record-wide query (deduped by Apollo across
  // every field's button), then grouped by field — this avoids per-field query
  // cache collisions where unrelated fields briefly showed a badge.
  const { fieldGroups } = useRecordFieldCommentThreads({
    recordId,
    objectNameSingular: objectNameSingular ?? '',
    skip: !objectNameSingular || !fieldMetadataId,
  });

  if (!objectNameSingular || !fieldMetadataId) {
    return null;
  }

  const threadCount =
    fieldGroups.find((group) => group.fieldMetadataId === fieldMetadataId)
      ?.threads.length ?? 0;
  const hasComments = threadCount > 0;

  // Persist the affordance when the field has comments; otherwise only on hover.
  if (!hasComments && !isHovered) {
    return null;
  }

  if (fieldCommentDefaultTarget === 'panel') {
    const handleOpenPanel = () => {
      setFieldCommentsPanelFocusFieldMetadataId(fieldMetadataId);
      setFieldCommentsPanelOpen(true);
    };

    return (
      <StyledButton
        type="button"
        hasComments={hasComments}
        onClick={handleOpenPanel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <IconMessage size={14} />
        {hasComments && <StyledCount>{threadCount}</StyledCount>}
      </StyledButton>
    );
  }

  // Key the dropdown by the instance-unique anchorId so a field rendered in
  // more than one place (e.g. multiple cells) doesn't share open state and
  // open two overlaid popovers.
  const dropdownId = `field-comment-${anchorId ?? `${recordId}-${fieldMetadataId}`}`;

  return (
    <Dropdown
      dropdownId={dropdownId}
      dropdownPlacement="bottom-start"
      clickableComponent={
        <StyledButton
          type="button"
          hasComments={hasComments}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <IconMessage size={14} />
          {hasComments && <StyledCount>{threadCount}</StyledCount>}
        </StyledButton>
      }
      dropdownComponents={
        <FieldCommentPopover
          recordId={recordId}
          objectNameSingular={objectNameSingular}
          fieldMetadataId={fieldMetadataId}
        />
      }
    />
  );
};
