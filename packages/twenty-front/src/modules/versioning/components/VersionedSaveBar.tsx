import { useCallback, useEffect, useRef } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { useNavigate, useBlocker } from 'react-router-dom';
import { styled } from '@linaria/react';
import { AnimatePresence, motion } from 'framer-motion';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { SaveAndCancelButtons } from '@/settings/components/SaveAndCancelButtons/SaveAndCancelButtons';
import { SAVE_VERSIONED_OBJECT_MUTATION } from '@/versioning/hooks/useSaveVersionedObject';
import { versionedRecordDraftState } from '@/versioning/states/versionedRecordDraftState';

const StyledBar = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--background-primary);
  border-top: 1px solid var(--border-color-medium);
  position: sticky;
  bottom: 0;
  width: 100%;
  z-index: 100;
`;

const StyledText = styled.span`
  font-size: 13px;
  color: var(--text-color-secondary);
`;

type VersionedSaveBarProps = {
  recordId: string;
};

export const VersionedSaveBar = ({ recordId }: VersionedSaveBarProps) => {
  const store = useStore();
  const navigate = useNavigate();
  const apolloCoreClient = useApolloCoreClient();

  const draft = useAtomValue(
    versionedRecordDraftState.atomFamily(recordId),
  );
  const hasChanges = draft && Object.keys(draft.changes).length > 0;
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!hasChanges) return;

    const handler = (event: BeforeUnloadEvent) => {
      if (isSavingRef.current) return;
      event.preventDefault();
    };

    window.addEventListener('beforeunload', handler);

    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      if (isSavingRef.current) return false;
      if (!hasChanges) return false;
      return currentLocation.pathname !== nextLocation.pathname;
    },
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const proceed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?',
      );

      if (proceed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  const handleSave = useCallback(async () => {
    if (!draft) return;

    const { objectNameSingular, changes } = draft;

    isSavingRef.current = true;

    try {
      const result = await apolloCoreClient.mutate<{
        saveVersionedObject: {
          id: string;
          version: number;
          isLatest: boolean;
          rootVersionId: string;
        };
      }>({
        mutation: SAVE_VERSIONED_OBJECT_MUTATION,
        variables: {
          objectNameSingular,
          id: recordId,
          data: changes,
        },
      });

      const versionedRecord = result.data?.saveVersionedObject;

      if (versionedRecord) {
        store.set(versionedRecordDraftState.atomFamily(recordId), null);
        navigate(`/object/${objectNameSingular}/${versionedRecord.id}`);
        return;
      }
    } catch (error) {
      console.error('Failed to save versioned object:', error);
    }

    isSavingRef.current = false;
  }, [apolloCoreClient, draft, navigate, recordId, store]);

  const handleDiscard = useCallback(() => {
    store.set(versionedRecordDraftState.atomFamily(recordId), null);
  }, [recordId, store]);

  return (
    <>
      <AnimatePresence>
        {hasChanges && (
          <StyledBar
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <StyledText>You have unsaved changes</StyledText>
            <SaveAndCancelButtons
              onSave={handleSave}
              onCancel={handleDiscard}
            />
          </StyledBar>
        )}
      </AnimatePresence>
    </>
  );
};
