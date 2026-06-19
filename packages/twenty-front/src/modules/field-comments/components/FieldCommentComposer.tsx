import { styled } from '@linaria/react';
import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { IconSend } from 'twenty-ui-deprecated/display';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

import { useFieldCommentTypeField } from '@/field-comments/hooks/useFieldCommentTypeField';

const StyledComposer = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledInputRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTypeSelect = styled.select`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[1]};
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
  onSubmit: (text: string, typeValue: string | null) => void;
  autoFocus?: boolean;
};

// Root-comment composer shared by the inline popover and the side panel. When
// the Note object has an optional "Type" SELECT field, it's offered here so the
// initial comment can be categorized (replies use a separate composer and
// never carry a type).
export const FieldCommentComposer = ({
  onSubmit,
  autoFocus,
}: FieldCommentComposerProps) => {
  const { t } = useLingui();
  const { fieldCommentTypeField } = useFieldCommentTypeField();
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedTypeValue, setSelectedTypeValue] = useState<string>('');

  const handleSubmit = () => {
    const text = newCommentText.trim();
    if (!isNonEmptyString(text)) {
      return;
    }
    setNewCommentText('');
    setSelectedTypeValue('');
    onSubmit(
      text,
      isNonEmptyString(selectedTypeValue) ? selectedTypeValue : null,
    );
  };

  return (
    <StyledComposer>
      {fieldCommentTypeField && (
        <StyledTypeSelect
          value={selectedTypeValue}
          onChange={(event) => setSelectedTypeValue(event.target.value)}
        >
          <option value="">{t`No ${fieldCommentTypeField.label}`}</option>
          {fieldCommentTypeField.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </StyledTypeSelect>
      )}
      <StyledInputRow>
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
      </StyledInputRow>
    </StyledComposer>
  );
};
