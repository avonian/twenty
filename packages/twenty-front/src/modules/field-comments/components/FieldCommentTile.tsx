import { styled } from '@linaria/react';
import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { IconArrowBackUp, IconCheck } from 'twenty-ui-deprecated/display';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { useFieldCommentTypeField } from '@/field-comments/hooks/useFieldCommentTypeField';
import { type FieldCommentThread } from '@/field-comments/types/FieldComment';
import { SelectDisplay } from '@/ui/field/display/components/SelectDisplay';
import { beautifyPastDateRelativeToNow } from '~/utils/date-utils';

const StyledTile = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledAuthorAndTime = styled.div`
  align-items: baseline;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledAuthor = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledTypeBadge = styled.div`
  display: flex;
`;

const StyledText = styled.div<{ isResolved: boolean }>`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  text-decoration: ${({ isResolved }) =>
    isResolved ? 'line-through' : 'none'};
  white-space: pre-wrap;
  word-break: break-word;
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTextButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  gap: 2px;
  padding: 2px;

  &:hover {
    color: ${themeCssVariables.font.color.secondary};
  }
`;

const StyledReplies = styled.div`
  border-left: 2px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  margin-left: ${themeCssVariables.spacing[2]};
  padding-left: ${themeCssVariables.spacing[2]};
`;

const StyledReply = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledReplyComposer = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  margin-left: ${themeCssVariables.spacing[2]};
  padding-left: ${themeCssVariables.spacing[2]};
`;

const StyledInput = styled.input`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[1]};
`;

type FieldCommentTileProps = {
  thread: FieldCommentThread;
  onReply: (text: string) => void;
  onToggleResolve: (isResolved: boolean) => void;
};

export const FieldCommentTile = ({
  thread,
  onReply,
  onToggleResolve,
}: FieldCommentTileProps) => {
  const { t } = useLingui();
  const { fieldCommentTypeField } = useFieldCommentTypeField();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Resolve the chosen "Type" SELECT option (when present) for a colored badge.
  const typeOption = isDefined(thread.type)
    ? fieldCommentTypeField?.options?.find(
        (option) => option.value === thread.type,
      )
    : undefined;

  const handleSubmitReply = () => {
    if (!isNonEmptyString(replyText.trim())) {
      return;
    }
    onReply(replyText.trim());
    setReplyText('');
    setIsReplying(false);
  };

  return (
    <StyledTile>
      <StyledHeader>
        <StyledAuthorAndTime>
          <StyledAuthor>{thread.createdBy.name}</StyledAuthor>
          <span>{beautifyPastDateRelativeToNow(thread.createdAt)}</span>
        </StyledAuthorAndTime>
        <StyledActions>
          <StyledTextButton
            type="button"
            onClick={() => onToggleResolve(!thread.isResolved)}
          >
            <IconCheck size={12} />
            {thread.isResolved ? t`Unresolve` : t`Resolve`}
          </StyledTextButton>
        </StyledActions>
      </StyledHeader>

      {isDefined(typeOption) && (
        <StyledTypeBadge>
          <SelectDisplay color={typeOption.color} label={typeOption.label} />
        </StyledTypeBadge>
      )}

      <StyledText isResolved={thread.isResolved}>{thread.title}</StyledText>

      {thread.replies.length > 0 && (
        <StyledReplies>
          {thread.replies.map((reply) => (
            <StyledReply key={reply.id}>
              <StyledAuthorAndTime>
                <StyledAuthor>{reply.createdBy.name}</StyledAuthor>
                <span>{beautifyPastDateRelativeToNow(reply.createdAt)}</span>
              </StyledAuthorAndTime>
              <StyledText isResolved={false}>{reply.title}</StyledText>
            </StyledReply>
          ))}
        </StyledReplies>
      )}

      {isReplying ? (
        <StyledReplyComposer>
          <StyledInput
            autoFocus
            value={replyText}
            placeholder={t`Reply...`}
            onChange={(event) => setReplyText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSubmitReply();
              }
            }}
          />
        </StyledReplyComposer>
      ) : (
        <StyledActions>
          <StyledTextButton type="button" onClick={() => setIsReplying(true)}>
            <IconArrowBackUp size={12} />
            {t`Reply`}
          </StyledTextButton>
        </StyledActions>
      )}
    </StyledTile>
  );
};
