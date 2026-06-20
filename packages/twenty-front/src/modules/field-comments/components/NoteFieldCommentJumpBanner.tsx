import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { AppPath } from 'twenty-shared/types';
import { IconArrowRight, IconMessage } from 'twenty-ui-deprecated/display';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

import { FIELD_COMMENT_DEEP_LINK_PARAM } from '@/field-comments/constants/FieldCommentDeepLinkParam';
import { useNoteFieldCommentTarget } from '@/field-comments/hooks/useNoteFieldCommentTarget';
import { useNavigateApp } from '~/hooks/useNavigateApp';

const StyledBanner = styled.button`
  align-items: center;
  background: ${themeCssVariables.color.yellow3};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  margin: ${themeCssVariables.spacing[2]} 0;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledText = styled.span`
  flex: 1;
`;

const StyledStrong = styled.span`
  font-weight: ${themeCssVariables.font.weight.medium};
`;

type NoteFieldCommentJumpBannerProps = {
  noteId: string;
};

// Shown on a field-comment note's record page: a one-click jump to the record
// the comment is anchored to, opening + highlighting the thread there.
export const NoteFieldCommentJumpBanner = ({
  noteId,
}: NoteFieldCommentJumpBannerProps) => {
  const { t } = useLingui();
  const navigateApp = useNavigateApp();

  const target = useNoteFieldCommentTarget(noteId);

  if (target === null) {
    return null;
  }

  const handleClick = () => {
    navigateApp(
      AppPath.RecordShowPage,
      {
        objectNameSingular: target.objectNameSingular,
        objectRecordId: target.recordId,
      },
      { [FIELD_COMMENT_DEEP_LINK_PARAM]: target.fieldMetadataId },
    );
  };

  return (
    <StyledBanner type="button" onClick={handleClick}>
      <IconMessage size={16} />
      <StyledText>
        {t`Comment on`} <StyledStrong>{target.fieldLabel}</StyledStrong> {t`on`}{' '}
        <StyledStrong>{target.recordName}</StyledStrong>
      </StyledText>
      {t`Open`}
      <IconArrowRight size={16} />
    </StyledBanner>
  );
};
