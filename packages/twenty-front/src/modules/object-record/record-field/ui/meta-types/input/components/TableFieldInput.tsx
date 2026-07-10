import { styled } from '@linaria/react';
import { useContext, useRef } from 'react';
import { Key } from 'ts-key-enum';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useTableField } from '@/object-record/record-field/ui/meta-types/hooks/useTableField';
import { buildTableCells } from '@/object-record/record-field/ui/meta-types/utils/buildTableCells';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import {
  type FieldTableCellValue,
  type FieldTableValue,
} from '@/object-record/record-field/ui/types/FieldMetadata';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import { useListenClickOutside } from '@/ui/utilities/pointer-event/hooks/useListenClickOutside';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';

const StyledContainer = styled.div`
  background: ${themeCssVariables.background.primary};
  border-radius: ${themeCssVariables.border.radius.md};
  box-shadow: ${themeCssVariables.boxShadow.strong};
  box-sizing: border-box;
  max-height: 400px;
  max-width: 560px;
  overflow: auto;
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledHeaderCell = styled.th`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.medium};
  color: ${themeCssVariables.font.color.tertiary};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  white-space: nowrap;
`;

const StyledLabelCell = styled.td`
  background: ${themeCssVariables.background.transparent.light};
  border: 1px solid ${themeCssVariables.border.color.medium};
  color: ${themeCssVariables.font.color.secondary};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  white-space: nowrap;
`;

const StyledCell = styled.td`
  border: 1px solid ${themeCssVariables.border.color.medium};
  padding: 0;
`;

const StyledInput = styled.input`
  background: transparent;
  border: none;
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  outline: none;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  width: 96px;

  &:focus {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

export const TableFieldInput = () => {
  const { fieldValue, draftValue, setDraftValue, settings } = useTableField();

  const instanceId = useAvailableComponentInstanceIdOrThrow(
    RecordFieldComponentInstanceContext,
  );
  const { onClickOutside, onEscape, onEnter } = useContext(
    FieldInputEventContext,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Single source of truth = the draft atom (survives re-mounts). We derive the
  // grid from it every render — no separate component state to fall out of sync.
  const cells = buildTableCells(draftValue ?? fieldValue, settings);

  const isNumber = settings?.cellType === 'NUMBER';

  const setCell = (rowIndex: number, columnIndex: number, raw: string) => {
    let parsed: FieldTableCellValue;

    if (isNumber) {
      const asNumber = Number(raw);
      parsed = raw.trim() === '' || Number.isNaN(asNumber) ? null : asNumber;
    } else {
      parsed = raw === '' ? null : raw;
    }

    const next = cells.map((row) => [...row]);
    next[rowIndex][columnIndex] = parsed;
    setDraftValue({ cells: next });
  };

  const currentValue = (): FieldTableValue => draftValue ?? { cells };

  useListenClickOutside({
    refs: [containerRef],
    callback: (event) => {
      onClickOutside?.({ newValue: currentValue(), event });
    },
    listenerId: instanceId,
  });

  useHotkeysOnFocusedElement({
    keys: [Key.Escape],
    callback: () => {
      onEscape?.({ newValue: currentValue() });
    },
    focusId: instanceId,
    dependencies: [draftValue],
  });

  if (!isDefined(settings)) {
    return <></>;
  }

  const hasLabels = isDefined(settings.firstColumnLabels);

  return (
    <StyledContainer ref={containerRef}>
      <StyledTable>
        <thead>
          <tr>
            {hasLabels && <StyledHeaderCell />}
            {settings.columns.map((column) => (
              <StyledHeaderCell key={column.key}>
                {column.header}
              </StyledHeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {cells.map((row, rowIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={rowIndex}>
              {hasLabels && (
                <StyledLabelCell>
                  {settings.firstColumnLabels?.[rowIndex] ?? ''}
                </StyledLabelCell>
              )}
              {row.map((cell, columnIndex) => (
                <StyledCell
                  key={settings.columns[columnIndex]?.key ?? columnIndex}
                >
                  <StyledInput
                    type={isNumber ? 'number' : 'text'}
                    value={cell ?? ''}
                    onChange={(event) =>
                      setCell(rowIndex, columnIndex, event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        onEnter?.({ newValue: currentValue() });
                      }
                    }}
                  />
                </StyledCell>
              ))}
            </tr>
          ))}
        </tbody>
      </StyledTable>
    </StyledContainer>
  );
};
