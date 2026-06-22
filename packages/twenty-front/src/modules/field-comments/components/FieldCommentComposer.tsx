import { styled } from '@linaria/react';
import { useEffect, useRef, useState } from 'react';
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

// Inline selectable chips rather than a native <select>: a native option list
// is rendered by the browser outside the React tree, so clicking an option
// reads as a click-outside and closes the popover/panel it lives in.
const StyledTypeOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTypeChip = styled.button<{ isSelected: boolean }>`
  background: ${({ isSelected }) =>
    isSelected
      ? themeCssVariables.background.transparent.blue
      : themeCssVariables.background.secondary};
  border: 1px solid
    ${({ isSelected }) =>
      isSelected
        ? themeCssVariables.color.blue
        : themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ isSelected }) =>
    isSelected
      ? themeCssVariables.color.blue
      : themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.xs};
  padding: 2px ${themeCssVariables.spacing[1]};
`;

const StyledInputRow = styled.div`
  align-items: flex-end;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

// Auto-grows with wrapped lines (height set from scrollHeight in an effect),
// up to a max height where it switches to scrolling. Overflow stays hidden
// while growing so no scrollbar shows until the cap is actually reached.
const StyledInput = styled.textarea`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.4;
  overflow-y: hidden;
  padding: ${themeCssVariables.spacing[1]};
  resize: none;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resize to fit content whenever the text changes (incl. the reset to one
  // line after submitting). Grow up to a cap, then switch to scrolling — the
  // scrollbar only appears once that cap is reached.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea === null) {
      return;
    }
    const MAX_HEIGHT_IN_PX = 120;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT_IN_PX)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_HEIGHT_IN_PX ? 'auto' : 'hidden';
  }, [newCommentText]);

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
        <StyledTypeOptions>
          {fieldCommentTypeField.options?.map((option) => {
            const isSelected = selectedTypeValue === option.value;

            return (
              <StyledTypeChip
                key={option.value}
                type="button"
                isSelected={isSelected}
                // Toggle: clicking the selected chip clears the type.
                onClick={() =>
                  setSelectedTypeValue(isSelected ? '' : option.value)
                }
              >
                {option.label}
              </StyledTypeChip>
            );
          })}
        </StyledTypeOptions>
      )}
      <StyledInputRow>
        <StyledInput
          ref={textareaRef}
          autoFocus={autoFocus}
          rows={1}
          value={newCommentText}
          placeholder={t`Add a comment...`}
          onChange={(event) => setNewCommentText(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends; Shift+Enter inserts a newline.
            if (event.key === 'Enter' && !event.shiftKey) {
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
