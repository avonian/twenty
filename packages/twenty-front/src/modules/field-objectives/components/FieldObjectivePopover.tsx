import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconLayoutSidebarRightExpand } from 'twenty-ui-deprecated/display';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

import { FieldCommentComposer } from '@/field-comments/components/FieldCommentComposer';
import { FieldCommentTile } from '@/field-comments/components/FieldCommentTile';
import { NOTE_BUCKET } from '@/field-comments/constants/NoteBucket';
import { useCreateFieldComment } from '@/field-comments/hooks/useCreateFieldComment';
import { useFieldCommentThreads } from '@/field-comments/hooks/useFieldCommentThreads';
import { useReplyToFieldComment } from '@/field-comments/hooks/useReplyToFieldComment';
import { useResolveFieldComment } from '@/field-comments/hooks/useResolveFieldComment';
import { fieldCommentDefaultTargetState } from '@/field-comments/states/fieldCommentDefaultTargetState';
import { fieldCommentsPanelOpenState } from '@/field-comments/states/fieldCommentsPanelState';
import {
  fieldObjectivesPanelFocusFieldMetadataIdState,
  fieldObjectivesPanelOpenState,
} from '@/field-objectives/states/fieldObjectivesPanelState';
import { OverlayContainer } from '@/ui/layout/overlay/components/OverlayContainer';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledPopover = styled(OverlayContainer)`
  align-items: stretch;
  display: flex;
  flex-direction: column;
  max-height: 360px;
  width: 320px;
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[2]};
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

const StyledThreadList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]};
  text-align: center;
`;

type FieldObjectivePopoverProps = {
  recordId: string;
  objectNameSingular: string;
  fieldMetadataId: string;
};

export const FieldObjectivePopover = ({
  recordId,
  objectNameSingular,
  fieldMetadataId,
}: FieldObjectivePopoverProps) => {
  const { t } = useLingui();

  const setFieldCommentDefaultTarget = useSetAtomState(
    fieldCommentDefaultTargetState,
  );
  const setFieldObjectivesPanelOpen = useSetAtomState(
    fieldObjectivesPanelOpenState,
  );
  const setFieldObjectivesPanelFocusFieldMetadataId = useSetAtomState(
    fieldObjectivesPanelFocusFieldMetadataIdState,
  );
  const setFieldCommentsPanelOpen = useSetAtomState(
    fieldCommentsPanelOpenState,
  );

  const { threads, refetch } = useFieldCommentThreads({
    recordId,
    objectNameSingular,
    fieldMetadataId,
    bucket: NOTE_BUCKET.OBJECTIVE,
  });

  const { createFieldComment } = useCreateFieldComment({
    recordId,
    objectNameSingular,
    fieldMetadataId,
    bucket: NOTE_BUCKET.OBJECTIVE,
  });

  const { replyToFieldComment } = useReplyToFieldComment();
  const { resolveFieldComment } = useResolveFieldComment();

  const handleCreateObjective = async (
    text: string,
    typeValue: string | null,
  ) => {
    await createFieldComment(text, typeValue);
    await refetch();
  };

  const handleReply = async (rootNoteId: string, text: string) => {
    await replyToFieldComment({ rootNoteId, text });
    await refetch();
  };

  const handleToggleResolve = async (
    rootNoteId: string,
    isResolved: boolean,
  ) => {
    await resolveFieldComment({ rootNoteId, isResolved });
    await refetch();
  };

  const handleOpenInPanel = () => {
    setFieldCommentsPanelOpen(false);
    setFieldCommentDefaultTarget('panel');
    setFieldObjectivesPanelFocusFieldMetadataId(fieldMetadataId);
    setFieldObjectivesPanelOpen(true);
  };

  return (
    <StyledPopover>
      <StyledHeader>
        {t`Objectives`}
        <StyledHeaderButton
          type="button"
          title={t`Open in side panel`}
          onClick={handleOpenInPanel}
        >
          <IconLayoutSidebarRightExpand size={14} />
        </StyledHeaderButton>
      </StyledHeader>
      <StyledThreadList>
        {threads.length === 0 ? (
          <StyledEmptyState>{t`No objectives yet`}</StyledEmptyState>
        ) : (
          threads.map((thread) => (
            <FieldCommentTile
              key={thread.id}
              thread={thread}
              onReply={(text) => handleReply(thread.id, text)}
              onToggleResolve={(isResolved) =>
                handleToggleResolve(thread.id, isResolved)
              }
            />
          ))
        )}
      </StyledThreadList>
      <FieldCommentComposer
        autoFocus
        showTypeField={false}
        placeholder={t`Add an objective...`}
        onSubmit={handleCreateObjective}
      />
    </StyledPopover>
  );
};
