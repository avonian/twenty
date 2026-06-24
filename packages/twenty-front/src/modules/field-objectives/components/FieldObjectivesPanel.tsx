import { isNonEmptyString } from '@sniptt/guards';
import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  IconLayoutSidebarRightCollapse,
  IconX,
} from 'twenty-ui-deprecated/display';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

import { NOTE_BUCKET } from '@/field-comments/constants/NoteBucket';
import { useIsFieldCommentableObject } from '@/field-comments/hooks/useIsFieldCommentableObject';
import { useRecordFieldCommentThreads } from '@/field-comments/hooks/useRecordFieldCommentThreads';
import { fieldCommentDefaultTargetState } from '@/field-comments/states/fieldCommentDefaultTargetState';
import { FieldObjectivesPanelFieldGroup } from '@/field-objectives/components/FieldObjectivesPanelFieldGroup';
import {
  fieldObjectivesPanelFocusFieldMetadataIdState,
  fieldObjectivesPanelOpenState,
} from '@/field-objectives/states/fieldObjectivesPanelState';
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
  gap: ${themeCssVariables.spacing[2]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[3]};
  text-align: center;
`;

type FieldObjectivesPanelProps = {
  recordId: string;
  objectNameSingular: string;
};

export const FieldObjectivesPanel = ({
  recordId,
  objectNameSingular,
}: FieldObjectivesPanelProps) => {
  const { t } = useLingui();

  const fieldObjectivesPanelOpen = useAtomStateValue(
    fieldObjectivesPanelOpenState,
  );
  const fieldObjectivesPanelFocusFieldMetadataId = useAtomStateValue(
    fieldObjectivesPanelFocusFieldMetadataIdState,
  );

  const setFieldObjectivesPanelOpen = useSetAtomState(
    fieldObjectivesPanelOpenState,
  );
  const setFieldCommentDefaultTarget = useSetAtomState(
    fieldCommentDefaultTargetState,
  );

  const isFieldCommentableObject =
    useIsFieldCommentableObject(objectNameSingular);

  const { fieldGroups, refetch } = useRecordFieldCommentThreads({
    recordId,
    objectNameSingular,
    bucket: NOTE_BUCKET.OBJECTIVE,
    skip: !fieldObjectivesPanelOpen || !isFieldCommentableObject,
  });

  const [expandedFieldMetadataId, setExpandedFieldMetadataId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (isNonEmptyString(fieldObjectivesPanelFocusFieldMetadataId)) {
      setExpandedFieldMetadataId(fieldObjectivesPanelFocusFieldMetadataId);
    }
  }, [fieldObjectivesPanelFocusFieldMetadataId]);

  if (!fieldObjectivesPanelOpen || !isFieldCommentableObject) {
    return null;
  }

  const handleToggleExpand = (fieldMetadataId: string) => {
    setExpandedFieldMetadataId((current) =>
      current === fieldMetadataId ? null : fieldMetadataId,
    );
  };

  const handleClose = () => {
    setFieldObjectivesPanelOpen(false);
  };

  const handleSwitchToPopover = () => {
    setFieldCommentDefaultTarget('popover');
    setFieldObjectivesPanelOpen(false);
  };

  return (
    <StyledPanel>
      <StyledHeader>
        <StyledTitle>{t`Objectives`}</StyledTitle>
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
          <StyledEmptyState>{t`No objectives on this record yet`}</StyledEmptyState>
        ) : (
          fieldGroups.map((group) => (
            <FieldObjectivesPanelFieldGroup
              key={group.fieldMetadataId}
              group={group}
              recordId={recordId}
              objectNameSingular={objectNameSingular}
              isFocused={
                group.fieldMetadataId ===
                fieldObjectivesPanelFocusFieldMetadataId
              }
              isExpanded={group.fieldMetadataId === expandedFieldMetadataId}
              onToggleExpand={() => handleToggleExpand(group.fieldMetadataId)}
              onMutated={refetch}
            />
          ))
        )}
      </StyledBody>
    </StyledPanel>
  );
};
