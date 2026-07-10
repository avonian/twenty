import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  IconBriefcase,
  IconCalendarEvent,
  IconChartBar,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconFlag,
  IconHistory,
} from 'twenty-ui-deprecated/display';
import { Button } from 'twenty-ui-deprecated/input';
import { MenuItem } from 'twenty-ui-deprecated/navigation';

import {
  NOTE_BUCKET,
  type NoteBucketValue,
} from '@/field-comments/constants/NoteBucket';
import { useLoadRelatedNotes } from '@/load-related-notes/hooks/useLoadRelatedNotes';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuHeaderLeftComponent } from '@/ui/layout/dropdown/components/DropdownMenuHeader/internal/DropdownMenuHeaderLeftComponent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';

type RelationRecord = { id: string; name?: string } | null;

type LoadRelatedNotesButtonProps = {
  eventoId: string;
  bucket?: NoteBucketValue;
  size?: 'small' | 'medium';
};

type PastEventoRecord = {
  id: string;
  name?: string;
  fechaInicio?: string | null;
};

const LoadRelatedNotesDropdownContent = ({
  eventoId,
  bucket,
  dropdownId,
  pais,
  distribuidor,
  performances,
  pastEventos,
}: {
  eventoId: string;
  bucket: NoteBucketValue;
  dropdownId: string;
  pais: RelationRecord;
  distribuidor: RelationRecord;
  performances: { id: string; name?: string }[];
  pastEventos: PastEventoRecord[];
}) => {
  const { t } = useLingui();
  const [view, setView] = useState<'main' | 'performances' | 'pastEvents'>(
    'main',
  );
  const { loadNotesFromSource } = useLoadRelatedNotes(eventoId, bucket);
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const { closeDropdown } = useCloseDropdown();

  const isObjectives = bucket === NOTE_BUCKET.OBJECTIVE;

  const reportResult = (linked: number, skipped: number) => {
    const loadedMessage = isObjectives
      ? t`Loaded ${linked} objective(s)`
      : t`Loaded ${linked} note(s)`;
    enqueueSuccessSnackBar({
      message:
        skipped > 0
          ? t`${loadedMessage} (${skipped} already linked)`
          : loadedMessage,
    });
  };

  const reportError = () =>
    enqueueErrorSnackBar({
      message: isObjectives
        ? t`Could not load objectives`
        : t`Could not load notes`,
    });

  const run = async (objectNameSingular: string, recordId: string) => {
    closeDropdown(dropdownId);
    try {
      const { linked, skipped } = await loadNotesFromSource(
        objectNameSingular,
        recordId,
      );
      reportResult(linked, skipped);
    } catch {
      reportError();
    }
  };

  // Bulk-load every past event of the distribuidor. Sequential so each call's
  // dedup (a fresh network-only fetch of what the evento already has) also
  // dedupes notes shared across several past events.
  const runAllPastEvents = async () => {
    closeDropdown(dropdownId);
    try {
      let linked = 0;
      let skipped = 0;
      for (const pastEvento of pastEventos) {
        const result = await loadNotesFromSource('evento', pastEvento.id);
        linked += result.linked;
        skipped += result.skipped;
      }
      reportResult(linked, skipped);
    } catch {
      reportError();
    }
  };

  const formatEventoLabel = (pastEvento: PastEventoRecord) => {
    const name = pastEvento.name ?? t`Untitled`;
    return pastEvento.fechaInicio
      ? `${name} · ${new Date(pastEvento.fechaInicio).toLocaleDateString()}`
      : name;
  };

  if (view === 'pastEvents') {
    return (
      <DropdownContent>
        <DropdownMenuHeader
          StartComponent={
            <DropdownMenuHeaderLeftComponent
              onClick={() => setView('main')}
              Icon={IconChevronLeft}
            />
          }
        >
          {t`Past events`}
        </DropdownMenuHeader>
        <DropdownMenuItemsContainer>
          {pastEventos.length === 0 ? (
            <MenuItem text={t`No past events`} />
          ) : (
            <>
              <MenuItem
                LeftIcon={IconHistory}
                text={t`From all past events`}
                onClick={runAllPastEvents}
              />
              {pastEventos.map((pastEvento) => (
                <MenuItem
                  key={pastEvento.id}
                  LeftIcon={IconCalendarEvent}
                  text={formatEventoLabel(pastEvento)}
                  onClick={() => run('evento', pastEvento.id)}
                />
              ))}
            </>
          )}
        </DropdownMenuItemsContainer>
      </DropdownContent>
    );
  }

  if (view === 'performances') {
    return (
      <DropdownContent>
        <DropdownMenuHeader
          StartComponent={
            <DropdownMenuHeaderLeftComponent
              onClick={() => setView('main')}
              Icon={IconChevronLeft}
            />
          }
        >
          {t`Performances`}
        </DropdownMenuHeader>
        <DropdownMenuItemsContainer>
          {performances.length === 0 ? (
            <MenuItem text={t`No performances`} />
          ) : (
            performances.map((performance) => (
              <MenuItem
                key={performance.id}
                text={performance.name ?? t`Untitled`}
                onClick={() => run('performance', performance.id)}
              />
            ))
          )}
        </DropdownMenuItemsContainer>
      </DropdownContent>
    );
  }

  return (
    <DropdownContent>
      <DropdownMenuItemsContainer>
        {pais !== null && (
          <MenuItem
            LeftIcon={IconFlag}
            text={t`From País: ${pais.name ?? ''}`}
            onClick={() => run('pais', pais.id)}
          />
        )}
        {distribuidor !== null && (
          <MenuItem
            LeftIcon={IconBriefcase}
            text={t`From Distribuidor: ${distribuidor.name ?? ''}`}
            onClick={() => run('distribuidor', distribuidor.id)}
          />
        )}
        {distribuidor !== null && (
          <MenuItem
            LeftIcon={IconChartBar}
            RightIcon={IconChevronRight}
            text={t`From Performance`}
            onClick={() => setView('performances')}
          />
        )}
        {distribuidor !== null && (
          <MenuItem
            LeftIcon={IconHistory}
            RightIcon={IconChevronRight}
            text={t`From past event`}
            onClick={() => setView('pastEvents')}
          />
        )}
      </DropdownMenuItemsContainer>
    </DropdownContent>
  );
};

// Flamagas: on an Evento's Notes tab, links notes from the evento's related
// País / Distribuidor / a chosen Performance onto the evento (reps then prune).
export const LoadRelatedNotesButton = ({
  eventoId,
  bucket = NOTE_BUCKET.NOTE,
  size = 'medium',
}: LoadRelatedNotesButtonProps) => {
  const { t } = useLingui();
  const dropdownId = `load-related-notes-${bucket}-${eventoId}`;

  const pais = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId: eventoId,
    fieldName: 'pais',
  }) as RelationRecord;
  const distribuidor = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId: eventoId,
    fieldName: 'distribuidor',
  }) as RelationRecord;

  const { records: performances } = useFindManyRecords<ObjectRecord>({
    objectNameSingular: 'performance',
    filter: { distribuidorId: { eq: distribuidor?.id ?? '' } },
    recordGqlFields: { id: true, name: true },
    skip: distribuidor === null,
  });

  // Every other evento of the same distribuidor, newest first. Option B: all
  // sibling events (not just strictly earlier ones); undated ones sink last.
  const { records: pastEventos } = useFindManyRecords<ObjectRecord>({
    objectNameSingular: 'evento',
    filter: {
      and: [
        { distribuidorId: { eq: distribuidor?.id ?? '' } },
        { id: { neq: eventoId } },
      ],
    },
    orderBy: [{ fechaInicio: 'DescNullsLast' }],
    recordGqlFields: { id: true, name: true, fechaInicio: true },
    skip: distribuidor === null,
  });

  return (
    <Dropdown
      dropdownId={dropdownId}
      dropdownPlacement="bottom-end"
      clickableComponent={
        <Button
          Icon={IconDownload}
          size={size}
          variant="secondary"
          title={
            bucket === NOTE_BUCKET.OBJECTIVE
              ? t`Load objectives`
              : t`Load notes`
          }
        />
      }
      dropdownComponents={
        <LoadRelatedNotesDropdownContent
          eventoId={eventoId}
          bucket={bucket}
          dropdownId={dropdownId}
          pais={pais}
          distribuidor={distribuidor}
          performances={performances as { id: string; name?: string }[]}
          pastEventos={pastEventos as PastEventoRecord[]}
        />
      }
    />
  );
};
