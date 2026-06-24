import { styled } from '@linaria/react';
import { useEffect, useRef } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  IconChevronDown,
  IconChevronRight,
} from 'twenty-ui-deprecated/display';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

import { FieldCommentComposer } from '@/field-comments/components/FieldCommentComposer';
import { FieldCommentTile } from '@/field-comments/components/FieldCommentTile';
import { NOTE_BUCKET } from '@/field-comments/constants/NoteBucket';
import { useCreateFieldComment } from '@/field-comments/hooks/useCreateFieldComment';
import { useReplyToFieldComment } from '@/field-comments/hooks/useReplyToFieldComment';
import { useResolveFieldComment } from '@/field-comments/hooks/useResolveFieldComment';
import { type FieldCommentFieldGroup } from '@/field-comments/types/FieldComment';
import {
  fieldObjectivesHoveredFromFormFieldMetadataIdState,
  fieldObjectivesHoveredFromPanelFieldMetadataIdState,
} from '@/field-objectives/states/fieldObjectivesPanelState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledGroup = styled.div<{ isHighlighted: boolean }>`
  background: ${({ isHighlighted }) =>
    isHighlighted
      ? themeCssVariables.color.yellow3
      : themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const StyledGroupHeader = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]};
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledFieldLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.04em;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
`;

const StyledCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  margin-left: auto;
`;

const StyledGroupBody = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
`;

type FieldObjectivesPanelFieldGroupProps = {
  group: FieldCommentFieldGroup;
  recordId: string;
  objectNameSingular: string;
  isFocused: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMutated: () => Promise<unknown>;
};

export const FieldObjectivesPanelFieldGroup = ({
  group,
  recordId,
  objectNameSingular,
  isFocused,
  isExpanded,
  onToggleExpand,
  onMutated,
}: FieldObjectivesPanelFieldGroupProps) => {
  const { t } = useLingui();
  const groupRef = useRef<HTMLDivElement>(null);

  const fieldObjectivesHoveredFromFormFieldMetadataId = useAtomStateValue(
    fieldObjectivesHoveredFromFormFieldMetadataIdState,
  );
  const setFieldObjectivesHoveredFromPanelFieldMetadataId = useSetAtomState(
    fieldObjectivesHoveredFromPanelFieldMetadataIdState,
  );

  const isHighlighted =
    fieldObjectivesHoveredFromFormFieldMetadataId === group.fieldMetadataId;

  const { createFieldComment } = useCreateFieldComment({
    recordId,
    objectNameSingular,
    fieldMetadataId: group.fieldMetadataId,
    bucket: NOTE_BUCKET.OBJECTIVE,
  });
  const { replyToFieldComment } = useReplyToFieldComment();
  const { resolveFieldComment } = useResolveFieldComment();

  useEffect(() => {
    if (isFocused && isExpanded) {
      groupRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [isFocused, isExpanded]);

  const handleCreateObjective = async (
    text: string,
    typeValue: string | null,
  ) => {
    await createFieldComment(text, typeValue);
    await onMutated();
  };

  const handleReply = async (rootNoteId: string, text: string) => {
    await replyToFieldComment({ rootNoteId, text });
    await onMutated();
  };

  const handleToggleResolve = async (
    rootNoteId: string,
    isResolved: boolean,
  ) => {
    await resolveFieldComment({ rootNoteId, isResolved });
    await onMutated();
  };

  return (
    <StyledGroup
      ref={groupRef}
      isHighlighted={isHighlighted}
      onMouseEnter={() =>
        setFieldObjectivesHoveredFromPanelFieldMetadataId(group.fieldMetadataId)
      }
      onMouseLeave={() =>
        setFieldObjectivesHoveredFromPanelFieldMetadataId(null)
      }
    >
      <StyledGroupHeader type="button" onClick={onToggleExpand}>
        {isExpanded ? (
          <IconChevronDown size={14} />
        ) : (
          <IconChevronRight size={14} />
        )}
        <StyledFieldLabel>{group.fieldLabel}</StyledFieldLabel>
        <StyledCount>{group.threads.length}</StyledCount>
      </StyledGroupHeader>
      {isExpanded && (
        <StyledGroupBody>
          {group.threads.map((thread) => (
            <FieldCommentTile
              key={thread.id}
              thread={thread}
              onReply={(text) => handleReply(thread.id, text)}
              onToggleResolve={(isResolved) =>
                handleToggleResolve(thread.id, isResolved)
              }
            />
          ))}
          <FieldCommentComposer
            showTypeField={false}
            placeholder={t`Add an objective...`}
            onSubmit={handleCreateObjective}
          />
        </StyledGroupBody>
      )}
    </StyledGroup>
  );
};
