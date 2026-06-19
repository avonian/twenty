import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { SettingsOptionCardContentToggle } from '@/settings/components/SettingsOptions/SettingsOptionCardContentToggle';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useMutation } from '@apollo/client/react';
import { t } from '@lingui/core/macro';
import { IconLayoutSidebarRightExpand } from 'twenty-ui-deprecated/display';
import { Card } from 'twenty-ui-deprecated/layout';
import { UpdateWorkspaceDocument } from '~/generated-metadata/graphql';

// Workspace-wide setting: when on, every member's record clicks open the full
// record page instead of the side panel, overriding each view's openRecordIn.
export const SettingsAlwaysOpenRecordInRecordPageToggle = () => {
  const { enqueueErrorSnackBar } = useSnackBar();

  const [currentWorkspace, setCurrentWorkspace] = useAtomState(
    currentWorkspaceState,
  );

  const [updateWorkspace] = useMutation(UpdateWorkspaceDocument);

  const handleChange = async (value: boolean) => {
    try {
      if (!currentWorkspace?.id) {
        throw new Error('User is not logged in');
      }
      await updateWorkspace({
        variables: {
          input: {
            isAlwaysOpenRecordInRecordPageEnabled: value,
          },
        },
      });
      setCurrentWorkspace({
        ...currentWorkspace,
        isAlwaysOpenRecordInRecordPageEnabled: value,
      });
    } catch (err: any) {
      enqueueErrorSnackBar({
        apolloError: CombinedGraphQLErrors.is(err) ? err : undefined,
      });
    }
  };

  return (
    <Card rounded>
      <SettingsOptionCardContentToggle
        Icon={IconLayoutSidebarRightExpand}
        title={t`Always open records in record page`}
        description={t`Skip the side panel and open the full record page everywhere, overriding each view's setting.`}
        checked={
          currentWorkspace?.isAlwaysOpenRecordInRecordPageEnabled ?? false
        }
        onChange={handleChange}
      />
    </Card>
  );
};
