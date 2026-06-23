import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  IconBriefcase,
  IconChartBar,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconFlag,
} from 'twenty-ui-deprecated/display';
import { Button } from 'twenty-ui-deprecated/input';
import { MenuItem } from 'twenty-ui-deprecated/navigation';

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
  size?: 'small' | 'medium';
};

const LoadRelatedNotesDropdownContent = ({
  eventoId,
  dropdownId,
  pais,
  distribuidor,
  performances,
}: {
  eventoId: string;
  dropdownId: string;
  pais: RelationRecord;
  distribuidor: RelationRecord;
  performances: { id: string; name?: string }[];
}) => {
  const { t } = useLingui();
  const [view, setView] = useState<'main' | 'performances'>('main');
  const { loadNotesFromSource } = useLoadRelatedNotes(eventoId);
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const { closeDropdown } = useCloseDropdown();

  const run = async (objectNameSingular: string, recordId: string) => {
    closeDropdown(dropdownId);
    try {
      const { linked, skipped } = await loadNotesFromSource(
        objectNameSingular,
        recordId,
      );
      enqueueSuccessSnackBar({
        message:
          skipped > 0
            ? t`Loaded ${linked} note(s) (${skipped} already linked)`
            : t`Loaded ${linked} note(s)`,
      });
    } catch {
      enqueueErrorSnackBar({ message: t`Could not load notes` });
    }
  };

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
      </DropdownMenuItemsContainer>
    </DropdownContent>
  );
};

// Flamagas: on an Evento's Notes tab, links notes from the evento's related
// País / Distribuidor / a chosen Performance onto the evento (reps then prune).
export const LoadRelatedNotesButton = ({
  eventoId,
  size = 'medium',
}: LoadRelatedNotesButtonProps) => {
  const { t } = useLingui();
  const dropdownId = `load-related-notes-${eventoId}`;

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

  return (
    <Dropdown
      dropdownId={dropdownId}
      dropdownPlacement="bottom-end"
      clickableComponent={
        <Button
          Icon={IconDownload}
          size={size}
          variant="secondary"
          title={t`Load notes`}
        />
      }
      dropdownComponents={
        <LoadRelatedNotesDropdownContent
          eventoId={eventoId}
          dropdownId={dropdownId}
          pais={pais}
          distribuidor={distribuidor}
          performances={performances as { id: string; name?: string }[]}
        />
      }
    />
  );
};
