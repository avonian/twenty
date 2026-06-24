import { styled } from '@linaria/react';
import { useContext, useEffect } from 'react';
import { IconTarget } from 'twenty-ui-deprecated/display';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';
import { isDefined } from 'twenty-shared/utils';

import { NOTE_BUCKET } from '@/field-comments/constants/NoteBucket';
import { useIsFieldCommentableObject } from '@/field-comments/hooks/useIsFieldCommentableObject';
import { useRecordFieldCommentThreads } from '@/field-comments/hooks/useRecordFieldCommentThreads';
import { fieldCommentDefaultTargetState } from '@/field-comments/states/fieldCommentDefaultTargetState';
import { fieldCommentsPanelOpenState } from '@/field-comments/states/fieldCommentsPanelState';
import { FieldObjectivePopover } from '@/field-objectives/components/FieldObjectivePopover';
import {
  fieldObjectivesHoveredFromFormFieldMetadataIdState,
  fieldObjectivesHoveredFromPanelFieldMetadataIdState,
  fieldObjectivesPanelFocusFieldMetadataIdState,
  fieldObjectivesPanelOpenState,
} from '@/field-objectives/states/fieldObjectivesPanelState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { FieldContext } from '@/object-record/record-field/ui/contexts/FieldContext';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledButton = styled.button<{ hasObjectives: boolean }>`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ hasObjectives }) =>
    hasObjectives
      ? themeCssVariables.color.red
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

type FieldObjectiveButtonProps = {
  isHovered: boolean;
};

export const FieldObjectiveButton = ({
  isHovered,
}: FieldObjectiveButtonProps) => {
  const { recordId, fieldDefinition, anchorId } = useContext(FieldContext);
  const { objectMetadataItems } = useObjectMetadataItems();

  // Shared with comments — one "open in side panel" preference for both.
  const fieldCommentDefaultTarget = useAtomStateValue(
    fieldCommentDefaultTargetState,
  );
  const fieldObjectivesPanelOpen = useAtomStateValue(
    fieldObjectivesPanelOpenState,
  );
  const setFieldObjectivesPanelOpen = useSetAtomState(
    fieldObjectivesPanelOpenState,
  );
  const setFieldObjectivesPanelFocusFieldMetadataId = useSetAtomState(
    fieldObjectivesPanelFocusFieldMetadataIdState,
  );
  const fieldObjectivesHoveredFromPanelFieldMetadataId = useAtomStateValue(
    fieldObjectivesHoveredFromPanelFieldMetadataIdState,
  );
  const setFieldObjectivesHoveredFromFormFieldMetadataId = useSetAtomState(
    fieldObjectivesHoveredFromFormFieldMetadataIdState,
  );
  // Panels are mutually exclusive — opening objectives closes comments.
  const setFieldCommentsPanelOpen = useSetAtomState(
    fieldCommentsPanelOpenState,
  );

  const fieldMetadataId = fieldDefinition?.fieldMetadataId;

  const isHighlightedFromPanel =
    isDefined(fieldMetadataId) &&
    fieldObjectivesHoveredFromPanelFieldMetadataId === fieldMetadataId;

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

  const handleMouseEnter = () => {
    if (isDefined(fieldMetadataId)) {
      setFieldObjectivesHoveredFromFormFieldMetadataId(fieldMetadataId);
    }
  };
  const handleMouseLeave = () =>
    setFieldObjectivesHoveredFromFormFieldMetadataId(null);

  const objectNameSingular =
    fieldDefinition?.metadata?.objectMetadataNameSingular ??
    objectMetadataItems.find((objectMetadataItem) =>
      objectMetadataItem.fields.some((field) => field.id === fieldMetadataId),
    )?.nameSingular;

  const isFieldCommentableObject =
    useIsFieldCommentableObject(objectNameSingular);

  const { fieldGroups } = useRecordFieldCommentThreads({
    recordId,
    objectNameSingular: objectNameSingular ?? '',
    bucket: NOTE_BUCKET.OBJECTIVE,
    skip: !objectNameSingular || !fieldMetadataId || !isFieldCommentableObject,
  });

  if (!objectNameSingular || !fieldMetadataId || !isFieldCommentableObject) {
    return null;
  }

  const threadCount =
    fieldGroups.find((group) => group.fieldMetadataId === fieldMetadataId)
      ?.threads.length ?? 0;
  const hasObjectives = threadCount > 0;

  if (!hasObjectives && !isHovered) {
    return null;
  }

  const isAddingNewObjective = !hasObjectives;

  if (fieldCommentDefaultTarget === 'panel' && !isAddingNewObjective) {
    const handleOpenPanel = () => {
      setFieldCommentsPanelOpen(false);
      setFieldObjectivesPanelFocusFieldMetadataId(fieldMetadataId);
      setFieldObjectivesPanelOpen(true);
    };

    return (
      <StyledButton
        type="button"
        hasObjectives={hasObjectives}
        onClick={handleOpenPanel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <IconTarget size={14} />
        {hasObjectives && <StyledCount>{threadCount}</StyledCount>}
      </StyledButton>
    );
  }

  const dropdownId = `field-objective-${anchorId ?? `${recordId}-${fieldMetadataId}`}`;

  const handlePopoverOpen = () => {
    if (isAddingNewObjective && fieldObjectivesPanelOpen) {
      setFieldObjectivesPanelOpen(false);
    }
  };

  return (
    <Dropdown
      dropdownId={dropdownId}
      onOpen={handlePopoverOpen}
      dropdownPlacement="bottom-start"
      clickableComponent={
        <StyledButton
          type="button"
          hasObjectives={hasObjectives}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <IconTarget size={14} />
          {hasObjectives && <StyledCount>{threadCount}</StyledCount>}
        </StyledButton>
      }
      dropdownComponents={
        <FieldObjectivePopover
          recordId={recordId}
          objectNameSingular={objectNameSingular}
          fieldMetadataId={fieldMetadataId}
        />
      }
    />
  );
};
