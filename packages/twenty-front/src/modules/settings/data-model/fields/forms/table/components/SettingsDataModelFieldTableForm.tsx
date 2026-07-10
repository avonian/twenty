import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Controller, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { useFieldMetadataItemById } from '@/object-metadata/hooks/useFieldMetadataItemById';
import { Separator } from '@/settings/components/Separator';
import { SettingsOptionCardContentSelect } from '@/settings/components/SettingsOptions/SettingsOptionCardContentSelect';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { Select } from '@/ui/input/components/Select';
import { isDefined } from 'twenty-shared/utils';
import {
  IconNumbers,
  IconPlus,
  IconTrash,
  IconTypography,
} from 'twenty-ui-deprecated/display';
import { Button, LightIconButton } from 'twenty-ui-deprecated/input';
import { themeCssVariables } from 'twenty-ui-deprecated/theme-constants';

const tableColumnSchema = z.object({
  key: z.string(),
  header: z.string(),
});

export const settingsDataModelFieldTableFormSchema = z.object({
  settings: z.object({
    columns: z.array(tableColumnSchema).min(1),
    rowCount: z.number().int().min(1),
    isRowCountFixed: z.boolean().optional(),
    firstColumnLabels: z.array(z.string()).optional(),
    cellType: z.enum(['TEXT', 'NUMBER']).optional(),
  }),
});

export type SettingsDataModelFieldTableFormValues = z.infer<
  typeof settingsDataModelFieldTableFormSchema
>;

type TableSettings = SettingsDataModelFieldTableFormValues['settings'];

type SettingsDataModelFieldTableFormProps = {
  disabled?: boolean;
  existingFieldMetadataId: string;
};

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} 0;
`;

const StyledSectionTitle = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledSectionDescription = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledInputContainer = styled.div`
  flex-grow: 1;
`;

const StyledAddButtonContainer = styled.div`
  display: flex;
`;

const buildColumnKey = () => `col-${Math.random().toString(36).slice(2, 10)}`;

const DEFAULT_TABLE_SETTINGS: TableSettings = {
  columns: [
    { key: 'col-a', header: 'Columna 1' },
    { key: 'col-b', header: 'Columna 2' },
  ],
  rowCount: 2,
  firstColumnLabels: ['', ''],
  cellType: 'NUMBER',
  isRowCountFixed: true,
};

// Normalizes a persisted/partial settings object into a fully-populated shape
// the editor can safely render (labels array always matches rowCount).
const normalizeSettings = (
  settings: Partial<TableSettings> | null | undefined,
): TableSettings => {
  if (!isDefined(settings) || !isDefined(settings.columns)) {
    return DEFAULT_TABLE_SETTINGS;
  }

  const rowCount = settings.rowCount ?? settings.firstColumnLabels?.length ?? 1;
  const firstColumnLabels = Array.from(
    { length: rowCount },
    (_, rowIndex) => settings.firstColumnLabels?.[rowIndex] ?? '',
  );

  return {
    columns: settings.columns,
    rowCount,
    firstColumnLabels,
    cellType: settings.cellType ?? 'NUMBER',
    isRowCountFixed: settings.isRowCountFixed ?? true,
  };
};

export const SettingsDataModelFieldTableForm = ({
  disabled,
  existingFieldMetadataId,
}: SettingsDataModelFieldTableFormProps) => {
  const { t } = useLingui();
  const { control } = useFormContext<SettingsDataModelFieldTableFormValues>();

  const { fieldMetadataItem } = useFieldMetadataItemById(
    existingFieldMetadataId,
  );

  const initialSettings = normalizeSettings(
    fieldMetadataItem?.settings as Partial<TableSettings> | undefined,
  );

  return (
    <Controller
      name="settings"
      defaultValue={initialSettings}
      control={control}
      render={({ field: { onChange, value } }) => {
        const settings = normalizeSettings(value);

        const updateColumnHeader = (columnIndex: number, header: string) => {
          const columns = settings.columns.map((column, index) =>
            index === columnIndex ? { ...column, header } : column,
          );
          onChange({ ...settings, columns });
        };

        const addColumn = () => {
          onChange({
            ...settings,
            columns: [
              ...settings.columns,
              { key: buildColumnKey(), header: '' },
            ],
          });
        };

        const removeColumn = (columnIndex: number) => {
          if (settings.columns.length <= 1) {
            return;
          }
          onChange({
            ...settings,
            columns: settings.columns.filter(
              (_, index) => index !== columnIndex,
            ),
          });
        };

        const updateRowLabel = (rowIndex: number, label: string) => {
          const firstColumnLabels = settings.firstColumnLabels?.map(
            (existingLabel, index) =>
              index === rowIndex ? label : existingLabel,
          );
          onChange({ ...settings, firstColumnLabels });
        };

        const addRow = () => {
          const firstColumnLabels = [...(settings.firstColumnLabels ?? []), ''];
          onChange({
            ...settings,
            rowCount: firstColumnLabels.length,
            firstColumnLabels,
          });
        };

        const removeRow = (rowIndex: number) => {
          if (settings.rowCount <= 1) {
            return;
          }
          const firstColumnLabels = (settings.firstColumnLabels ?? []).filter(
            (_, index) => index !== rowIndex,
          );
          onChange({
            ...settings,
            rowCount: firstColumnLabels.length,
            firstColumnLabels,
          });
        };

        return (
          <>
            <SettingsOptionCardContentSelect
              Icon={IconNumbers}
              title={t`Cell content`}
              description={t`What can be typed into the table cells`}
            >
              <Select<'TEXT' | 'NUMBER'>
                selectSizeVariant="small"
                dropdownId="table-cell-type"
                dropdownWidth={120}
                value={settings.cellType ?? 'NUMBER'}
                onChange={(cellType) => onChange({ ...settings, cellType })}
                disabled={disabled}
                needIconCheck={false}
                options={[
                  { value: 'NUMBER', label: t`Number`, Icon: IconNumbers },
                  { value: 'TEXT', label: t`Text`, Icon: IconTypography },
                ]}
              />
            </SettingsOptionCardContentSelect>

            <Separator />

            <StyledSection>
              <StyledSectionTitle>{t`Columns`}</StyledSectionTitle>
              <StyledSectionDescription>
                {t`Column headers shown across the top of the table.`}
              </StyledSectionDescription>
              {settings.columns.map((column, columnIndex) => (
                <StyledRow key={column.key}>
                  <StyledInputContainer>
                    <SettingsTextInput
                      instanceId={`table-column-${column.key}`}
                      value={column.header}
                      onChange={(header) =>
                        updateColumnHeader(columnIndex, header)
                      }
                      placeholder={t`Column header`}
                      disabled={disabled}
                    />
                  </StyledInputContainer>
                  <LightIconButton
                    accent="tertiary"
                    Icon={IconTrash}
                    disabled={disabled || settings.columns.length <= 1}
                    onClick={() => removeColumn(columnIndex)}
                  />
                </StyledRow>
              ))}
              <StyledAddButtonContainer>
                <Button
                  Icon={IconPlus}
                  title={t`Add column`}
                  variant="secondary"
                  size="small"
                  onClick={addColumn}
                  disabled={disabled}
                />
              </StyledAddButtonContainer>
            </StyledSection>

            <Separator />

            <StyledSection>
              <StyledSectionTitle>{t`Rows`}</StyledSectionTitle>
              <StyledSectionDescription>
                {t`Left-column labels for each row (e.g. "Sell In"). Leave blank for an unlabeled row.`}
              </StyledSectionDescription>
              {(settings.firstColumnLabels ?? []).map((label, rowIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <StyledRow key={rowIndex}>
                  <StyledInputContainer>
                    <SettingsTextInput
                      instanceId={`table-row-${rowIndex}`}
                      value={label}
                      onChange={(newLabel) =>
                        updateRowLabel(rowIndex, newLabel)
                      }
                      placeholder={t`Row label`}
                      disabled={disabled}
                    />
                  </StyledInputContainer>
                  <LightIconButton
                    accent="tertiary"
                    Icon={IconTrash}
                    disabled={disabled || settings.rowCount <= 1}
                    onClick={() => removeRow(rowIndex)}
                  />
                </StyledRow>
              ))}
              <StyledAddButtonContainer>
                <Button
                  Icon={IconPlus}
                  title={t`Add row`}
                  variant="secondary"
                  size="small"
                  onClick={addRow}
                  disabled={disabled}
                />
              </StyledAddButtonContainer>
            </StyledSection>
          </>
        );
      }}
    />
  );
};
