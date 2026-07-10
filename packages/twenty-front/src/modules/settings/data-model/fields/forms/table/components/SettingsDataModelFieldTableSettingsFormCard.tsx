import { styled } from '@linaria/react';
import { useFormContext } from 'react-hook-form';

import { SettingsDataModelPreviewFormCard } from '@/settings/data-model/components/SettingsDataModelPreviewFormCard';
import {
  SettingsDataModelFieldTableForm,
  type SettingsDataModelFieldTableFormValues,
} from '@/settings/data-model/fields/forms/table/components/SettingsDataModelFieldTableForm';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

type SettingsDataModelFieldTableSettingsFormCardProps = {
  existingFieldMetadataId: string;
  disabled?: boolean;
};

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
  color: ${themeCssVariables.font.color.light};
  min-width: 48px;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

// A live, read-only structural preview built directly from the form settings —
// self-contained so it never depends on a stored record value.
const SettingsDataModelFieldTablePreview = () => {
  const { watch } = useFormContext<SettingsDataModelFieldTableFormValues>();

  const settings = watch('settings');
  const columns = settings?.columns ?? [];
  const rowCount = settings?.rowCount ?? 0;
  const firstColumnLabels = settings?.firstColumnLabels;
  const hasLabels = isDefined(firstColumnLabels);

  return (
    <StyledTable>
      <thead>
        <tr>
          {hasLabels && <StyledHeaderCell />}
          {columns.map((column) => (
            <StyledHeaderCell key={column.key}>
              {column.header}
            </StyledHeaderCell>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          // eslint-disable-next-line react/no-array-index-key
          <tr key={rowIndex}>
            {hasLabels && (
              <StyledLabelCell>
                {firstColumnLabels?.[rowIndex] ?? ''}
              </StyledLabelCell>
            )}
            {columns.map((column) => (
              <StyledCell key={column.key} />
            ))}
          </tr>
        ))}
      </tbody>
    </StyledTable>
  );
};

export const SettingsDataModelFieldTableSettingsFormCard = ({
  existingFieldMetadataId,
  disabled = false,
}: SettingsDataModelFieldTableSettingsFormCardProps) => (
  <SettingsDataModelPreviewFormCard
    preview={<SettingsDataModelFieldTablePreview />}
    form={
      <SettingsDataModelFieldTableForm
        existingFieldMetadataId={existingFieldMetadataId}
        disabled={disabled}
      />
    }
  />
);
