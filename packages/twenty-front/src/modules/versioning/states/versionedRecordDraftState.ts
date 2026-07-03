import { createAtomFamilyState } from '@/ui/utilities/state/jotai/utils/createAtomFamilyState';

export type VersionedRecordDraft = {
  recordId: string;
  objectNameSingular: string;
  changes: Record<string, unknown>;
};

export const versionedRecordDraftState = createAtomFamilyState<
  VersionedRecordDraft | null | undefined,
  string
>({
  key: 'versionedRecordDraftState',
  defaultValue: null,
  useLocalStorage: true,
});
