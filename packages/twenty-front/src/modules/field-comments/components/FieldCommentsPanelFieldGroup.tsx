import { styled } from '@linaria/react';
import { useEffect, useRef } from 'react';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

import { FieldCommentComposer } from '@/field-comments/components/FieldCommentComposer';
import { FieldCommentTile } from '@/field-comments/components/FieldCommentTile';
import { useCreateFieldComment } from '@/field-comments/hooks/useCreateFieldComment';
import { useReplyToFieldComment } from '@/field-comments/hooks/useReplyToFieldComment';
import { useResolveFieldComment } from '@/field-comments/hooks/useResolveFieldComment';
import {
  fieldCommentsHoveredFromFormFieldMetadataIdState,
  fieldCommentsHoveredFromPanelFieldMetadataIdState,
} from '@/field-comments/states/fieldCommentsPanelState';
import { type FieldCommentFieldGroup } from '@/field-comments/types/FieldComment';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledGroup = styled.div<{ isHighlighted: boolean }>`
  background: ${({ isHighlighted }) =>
    isHighlighted ? themeCssVariables.color.yellow3 : 'transparent'};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
`;

const StyledGroupHeader = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.04em;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[2]} 0;
  text-transform: uppercase;
`;

type FieldCommentsPanelFieldGroupProps = {
  group: FieldCommentFieldGroup;
  recordId: string;
  objectNameSingular: string;
  isFocused: boolean;
  onMutated: () => Promise<unknown>;
};

export const FieldCommentsPanelFieldGroup = ({
  group,
  recordId,
  objectNameSingular,
  isFocused,
  onMutated,
}: FieldCommentsPanelFieldGroupProps) => {
  const groupRef = useRef<HTMLDivElement>(null);

  const fieldCommentsHoveredFromFormFieldMetadataId = useAtomStateValue(
    fieldCommentsHoveredFromFormFieldMetadataIdState,
  );
  const setFieldCommentsHoveredFromPanelFieldMetadataId = useSetAtomState(
    fieldCommentsHoveredFromPanelFieldMetadataIdState,
  );

  // Highlight this card only when the matching field's icon is hovered on the
  // form — not when the card itself is hovered (the cursor is already there).
  const isHighlighted =
    fieldCommentsHoveredFromFormFieldMetadataId === group.fieldMetadataId;

  const { createFieldComment } = useCreateFieldComment({
    recordId,
    objectNameSingular,
    fieldMetadataId: group.fieldMetadataId,
  });
  const { replyToFieldComment } = useReplyToFieldComment();
  const { resolveFieldComment } = useResolveFieldComment();

  // Scroll the field that was clicked into view when the panel opens.
  useEffect(() => {
    if (isFocused) {
      groupRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [isFocused]);

  const handleCreateComment = async (
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
        setFieldCommentsHoveredFromPanelFieldMetadataId(group.fieldMetadataId)
      }
      onMouseLeave={() => setFieldCommentsHoveredFromPanelFieldMetadataId(null)}
    >
      <StyledGroupHeader>{group.fieldLabel}</StyledGroupHeader>
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
      <FieldCommentComposer onSubmit={handleCreateComment} />
    </StyledGroup>
  );
};
