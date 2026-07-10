import { type FieldMetadataTableSettings } from 'twenty-shared/types';

import {
  type FieldTableCellValue,
  type FieldTableValue,
} from '@/object-record/record-field/ui/types/FieldMetadata';

// Builds a rowCount × columns grid from the stored value, padding missing cells
// with null so the editor/display always match the schema's dimensions.
export const buildTableCells = (
  value: FieldTableValue | null | undefined,
  settings: FieldMetadataTableSettings | null | undefined,
): FieldTableCellValue[][] => {
  const existing = value?.cells ?? [];
  const rowCount = settings?.rowCount ?? existing.length;
  const columnCount = settings?.columns.length ?? existing[0]?.length ?? 0;

  return Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from(
      { length: columnCount },
      (_, columnIndex) => existing[rowIndex]?.[columnIndex] ?? null,
    ),
  );
};
