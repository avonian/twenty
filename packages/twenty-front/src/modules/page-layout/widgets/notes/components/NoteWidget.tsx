import { NotesCard } from '@/activities/notes/components/NotesCard';
import { EventoNotesTable } from '@/load-related-notes/components/EventoNotesTable';
import { IS_LOAD_RELATED_NOTES_ENABLED } from '@/load-related-notes/constants/IsLoadRelatedNotesEnabled';
import { LOAD_RELATED_NOTES_OBJECT_NAME_SINGULAR } from '@/load-related-notes/constants/LoadRelatedNotesObjectNameSingular';
import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { SidePanelProvider } from '@/ui/layout/side-panel/contexts/SidePanelContext';
import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

type NoteWidgetProps = {
  widget: PageLayoutWidget;
};

export const NoteWidget = ({ widget: _widget }: NoteWidgetProps) => {
  const { isInSidePanel, targetRecordIdentifier } = useLayoutRenderingContext();

  // Flamagas: eventos get a custom table (load from related sources + prune)
  // in place of the native Notes list.
  const showEventoNotesTable =
    IS_LOAD_RELATED_NOTES_ENABLED &&
    isDefined(targetRecordIdentifier) &&
    targetRecordIdentifier.targetObjectNameSingular ===
      LOAD_RELATED_NOTES_OBJECT_NAME_SINGULAR;

  return (
    <SidePanelProvider value={{ isInSidePanel }}>
      <StyledContainer>
        {showEventoNotesTable ? (
          <EventoNotesTable eventoId={targetRecordIdentifier.id} />
        ) : (
          <NotesCard />
        )}
      </StyledContainer>
    </SidePanelProvider>
  );
};
