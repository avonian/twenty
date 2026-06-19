import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import {
  IconLayoutSidebarRightCollapse,
  IconX,
} from 'twenty-ui-deprecated/display';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

import { FieldCommentsPanelFieldGroup } from '@/field-comments/components/FieldCommentsPanelFieldGroup';
import { useRecordFieldCommentThreads } from '@/field-comments/hooks/useRecordFieldCommentThreads';
import { fieldCommentDefaultTargetState } from '@/field-comments/states/fieldCommentDefaultTargetState';
import {
  fieldCommentsPanelFocusFieldMetadataIdState,
  fieldCommentsPanelOpenState,
} from '@/field-comments/states/fieldCommentsPanelState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledPanel = styled.aside`
  background: ${themeCssVariables.background.primary};
  border-left: 1px solid ${themeCssVariables.border.color.medium};
  bottom: 0;
  box-shadow: ${themeCssVariables.boxShadow.strong};
  display: flex;
  flex-direction: column;
  position: fixed;
  right: 0;
  top: 0;
  width: 360px;
  z-index: 40;
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledHeaderActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledHeaderButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  padding: ${themeCssVariables.spacing[1]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.secondary};
  }
`;

const StyledBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[3]};
  text-align: center;
`;

type FieldCommentsPanelProps = {
  recordId: string;
  objectNameSingular: string;
};

export const FieldCommentsPanel = ({
  recordId,
  objectNameSingular,
}: FieldCommentsPanelProps) => {
  const { t } = useLingui();

  const fieldCommentsPanelOpen = useAtomStateValue(fieldCommentsPanelOpenState);
  const fieldCommentsPanelFocusFieldMetadataId = useAtomStateValue(
    fieldCommentsPanelFocusFieldMetadataIdState,
  );

  const setFieldCommentsPanelOpen = useSetAtomState(
    fieldCommentsPanelOpenState,
  );
  const setFieldCommentDefaultTarget = useSetAtomState(
    fieldCommentDefaultTargetState,
  );

  const { fieldGroups, refetch } = useRecordFieldCommentThreads({
    recordId,
    objectNameSingular,
    skip: !fieldCommentsPanelOpen,
  });

  if (!fieldCommentsPanelOpen) {
    return null;
  }

  const handleClose = () => {
    setFieldCommentsPanelOpen(false);
  };

  // Revert to the inline popover as the default open target.
  const handleSwitchToPopover = () => {
    setFieldCommentDefaultTarget('popover');
    setFieldCommentsPanelOpen(false);
  };

  return (
    <StyledPanel>
      <StyledHeader>
        <StyledTitle>{t`Comments`}</StyledTitle>
        <StyledHeaderActions>
          <StyledHeaderButton
            type="button"
            title={t`Use inline popover`}
            onClick={handleSwitchToPopover}
          >
            <IconLayoutSidebarRightCollapse size={16} />
          </StyledHeaderButton>
          <StyledHeaderButton
            type="button"
            title={t`Close`}
            onClick={handleClose}
          >
            <IconX size={16} />
          </StyledHeaderButton>
        </StyledHeaderActions>
      </StyledHeader>
      <StyledBody>
        {fieldGroups.length === 0 ? (
          <StyledEmptyState>{t`No comments on this record yet`}</StyledEmptyState>
        ) : (
          fieldGroups.map((group) => (
            <FieldCommentsPanelFieldGroup
              key={group.fieldMetadataId}
              group={group}
              recordId={recordId}
              objectNameSingular={objectNameSingular}
              isFocused={
                group.fieldMetadataId === fieldCommentsPanelFocusFieldMetadataId
              }
              onMutated={refetch}
            />
          ))
        )}
      </StyledBody>
    </StyledPanel>
  );
};
