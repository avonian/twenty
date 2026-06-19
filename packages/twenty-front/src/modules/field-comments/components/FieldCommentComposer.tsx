import { styled } from '@linaria/react';
import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { IconSend } from 'twenty-ui-deprecated/display';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

const StyledComposer = styled.div`
  align-items: center;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]};
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

const StyledSendButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${themeCssVariables.color.blue};
  cursor: pointer;
  display: flex;
  padding: ${themeCssVariables.spacing[1]};

  &:disabled {
    color: ${themeCssVariables.font.color.light};
    cursor: default;
  }
`;

type FieldCommentComposerProps = {
  onSubmit: (text: string) => void;
  autoFocus?: boolean;
};

// Root-comment composer shared by the inline popover and the side panel.
export const FieldCommentComposer = ({
  onSubmit,
  autoFocus,
}: FieldCommentComposerProps) => {
  const { t } = useLingui();
  const [newCommentText, setNewCommentText] = useState('');

  const handleSubmit = () => {
    const text = newCommentText.trim();
    if (!isNonEmptyString(text)) {
      return;
    }
    setNewCommentText('');
    onSubmit(text);
  };

  return (
    <StyledComposer>
      <StyledInput
        autoFocus={autoFocus}
        value={newCommentText}
        placeholder={t`Add a comment...`}
        onChange={(event) => setNewCommentText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleSubmit();
          }
        }}
      />
      <StyledSendButton
        type="button"
        disabled={!isNonEmptyString(newCommentText.trim())}
        onClick={handleSubmit}
      >
        <IconSend size={16} />
      </StyledSendButton>
    </StyledComposer>
  );
};
