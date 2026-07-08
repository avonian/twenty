import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import {
  IconArrowRight,
  IconPlus,
  IconTrash,
} from 'twenty-ui-deprecated/display';
import { Button } from 'twenty-ui-deprecated/input';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

import { useOpenCreateActivityDrawer } from '@/activities/hooks/useOpenCreateActivityDrawer';
import { FIELD_COMMENT_DEEP_LINK_PARAM } from '@/field-comments/constants/FieldCommentDeepLinkParam';
import {
  NOTE_BUCKET,
  type NoteBucketValue,
} from '@/field-comments/constants/NoteBucket';
import { FIELD_OBJECTIVE_DEEP_LINK_PARAM } from '@/field-objectives/constants/FieldObjectiveDeepLinkParam';
import { LoadRelatedNotesButton } from '@/load-related-notes/components/LoadRelatedNotesButton';
import { LOAD_RELATED_NOTES_OBJECT_NAME_SINGULAR } from '@/load-related-notes/constants/LoadRelatedNotesObjectNameSingular';
import {
  type EventoRelatedNoteSource,
  useEventoRelatedNotes,
} from '@/load-related-notes/hooks/useEventoRelatedNotes';
import { useNavigateApp } from '~/hooks/useNavigateApp';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledHeaderActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTitle = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const StyledTh = styled.th`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;
`;

const StyledRow = styled.tr`
  cursor: pointer;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledTd = styled.td`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  max-width: 0;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[2]};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledTipo = styled.span`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledActionCell = styled.td`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  padding: ${themeCssVariables.spacing[2]};
  text-align: right;
  white-space: nowrap;
`;

const StyledIconButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: inline-flex;
  padding: ${themeCssVariables.spacing[1]};

  &:hover {
    background: ${themeCssVariables.background.transparent.medium};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
  padding: ${themeCssVariables.spacing[4]} 0;
  text-align: center;
`;

type EventoNotesTableProps = {
  eventoId: string;
  bucket?: NoteBucketValue;
};

// Flamagas: replaces the native Notes tab for an Evento with a read-only table
// of the notes pulled in from its related País / Distribuidor / Performance.
// Each row jumps to the note's source thread; reps prune the ones they don't
// want. Notes are shared (links), never copied. The same table serves the
// Objetivos tab via the bucket prop.
export const EventoNotesTable = ({
  eventoId,
  bucket = NOTE_BUCKET.NOTE,
}: EventoNotesTableProps) => {
  const { t } = useLingui();
  const navigateApp = useNavigateApp();
  const { rows, loading, removeFromEvento } = useEventoRelatedNotes(
    eventoId,
    bucket,
  );

  const isObjectives = bucket === NOTE_BUCKET.OBJECTIVE;

  // Same flow the other objects use for "+ Add note": open the native create
  // drawer, linking the new note to this evento at record level (noteTarget's
  // targetFieldMetadataId stays null, so it's a general note, not a field one).
  const openCreateActivity = useOpenCreateActivityDrawer({
    activityObjectNameSingular: CoreObjectNameSingular.Note,
  });

  const openSource = (source: EventoRelatedNoteSource | null) => {
    if (!isDefined(source)) {
      return;
    }

    const deepLinkParam = isObjectives
      ? FIELD_OBJECTIVE_DEEP_LINK_PARAM
      : FIELD_COMMENT_DEEP_LINK_PARAM;

    navigateApp(
      AppPath.RecordShowPage,
      {
        objectNameSingular: source.objectNameSingular,
        objectRecordId: source.recordId,
      },
      isDefined(source.fieldMetadataId)
        ? { [deepLinkParam]: source.fieldMetadataId }
        : undefined,
    );
  };

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitle>{isObjectives ? t`Objectives` : t`Notes`}</StyledTitle>
        <StyledHeaderActions>
          <LoadRelatedNotesButton
            eventoId={eventoId}
            bucket={bucket}
            size="small"
          />
          {!isObjectives && (
            <Button
              Icon={IconPlus}
              title={t`Add note`}
              variant="secondary"
              size="small"
              onClick={() =>
                openCreateActivity({
                  targetableObjects: [
                    {
                      id: eventoId,
                      targetObjectNameSingular:
                        LOAD_RELATED_NOTES_OBJECT_NAME_SINGULAR,
                    },
                  ],
                })
              }
            />
          )}
        </StyledHeaderActions>
      </StyledHeader>

      {!loading && rows.length === 0 ? (
        <StyledEmpty>
          {isObjectives
            ? t`No objectives yet. Use "Load objectives" to pull them from the related País, Distribuidor or Performance.`
            : t`No notes yet. Use "Load notes" to pull them from the related País, Distribuidor or Performance.`}
        </StyledEmpty>
      ) : (
        <StyledTable>
          <thead>
            <tr>
              <StyledTh>{t`Name`}</StyledTh>
              {!isObjectives && <StyledTh>{t`Type`}</StyledTh>}
              <StyledTh>
                {isObjectives ? t`Objective` : t`Main comment`}
              </StyledTh>
              <StyledTh>{t`Created by`}</StyledTh>
              <StyledTh />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <StyledRow
                key={row.eventoNoteTargetId}
                onClick={() => openSource(row.source)}
              >
                <StyledTd>{row.nombre || t`Untitled`}</StyledTd>
                {!isObjectives && (
                  <StyledTd>
                    {row.tipoLabel.length > 0 && (
                      <StyledTipo>{row.tipoLabel}</StyledTipo>
                    )}
                  </StyledTd>
                )}
                <StyledTd>{row.comentario}</StyledTd>
                <StyledTd>{row.createdBy || t`Unknown`}</StyledTd>
                <StyledActionCell>
                  {isDefined(row.source) && (
                    <StyledIconButton
                      type="button"
                      title={t`Open source`}
                      onClick={(event) => {
                        event.stopPropagation();
                        openSource(row.source);
                      }}
                    >
                      <IconArrowRight size={16} />
                    </StyledIconButton>
                  )}
                  <StyledIconButton
                    type="button"
                    title={t`Remove from this evento`}
                    onClick={(event) => {
                      event.stopPropagation();
                      void removeFromEvento(row.eventoNoteTargetId);
                    }}
                  >
                    <IconTrash size={16} />
                  </StyledIconButton>
                </StyledActionCell>
              </StyledRow>
            ))}
          </tbody>
        </StyledTable>
      )}
    </StyledContainer>
  );
};
