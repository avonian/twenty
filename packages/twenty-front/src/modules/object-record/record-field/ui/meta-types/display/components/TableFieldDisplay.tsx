import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

import { useTableFieldDisplay } from '@/object-record/record-field/ui/meta-types/hooks/useTableFieldDisplay';
import { buildTableCells } from '@/object-record/record-field/ui/meta-types/utils/buildTableCells';

const StyledTable = styled.table`
  border-collapse: collapse;
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledCell = styled.td`
  border: 1px solid ${themeCssVariables.border.color.medium};
  color: ${themeCssVariables.font.color.primary};
  max-width: 160px;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledHeaderCell = styled(StyledCell)`
  background: ${themeCssVariables.background.transparent.light};
  color: ${themeCssVariables.font.color.tertiary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledLabelCell = styled(StyledCell)`
  background: ${themeCssVariables.background.transparent.light};
  color: ${themeCssVariables.font.color.secondary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

export const TableFieldDisplay = () => {
  const { fieldValue, settings } = useTableFieldDisplay();

  if (!isDefined(settings)) {
    return <></>;
  }

  const cells = buildTableCells(fieldValue, settings);
  const hasLabels = isDefined(settings.firstColumnLabels);

  return (
    <StyledTable>
      <thead>
        <tr>
          {hasLabels && <StyledHeaderCell as="th" />}
          {settings.columns.map((column) => (
            <StyledHeaderCell as="th" key={column.key}>
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
              <StyledCell key={settings.columns[columnIndex]?.key ?? columnIndex}>
                {cell ?? ''}
              </StyledCell>
            ))}
          </tr>
        ))}
      </tbody>
    </StyledTable>
  );
};
