import { useCallback, useEffect } from 'react';

import { usePushFocusItemToFocusStack } from '@/ui/utilities/focus/hooks/usePushFocusItemToFocusStack';
import { useRemoveFocusItemFromFocusStackById } from '@/ui/utilities/focus/hooks/useRemoveFocusItemFromFocusStackById';
import { type FocusComponentType } from '@/ui/utilities/focus/types/FocusComponentType';

// The comment composer and reply box are plain <textarea>/<input> that don't
// join Twenty's focus stack on their own. Letter-based global hotkeys — notably
// the "g"+key go-to navigation shortcuts, which are bound with
// enableOnFormTags — therefore stay live while typing, so a message containing
// the right two letters navigates away mid-reply. Pushing a focus-stack item
// that turns off keyboard-conflicting global hotkeys while the field is focused
// (the same thing Twenty's own inputs do) fixes it; it is removed on blur and on
// unmount so the popover/panel closing can't leave hotkeys globally disabled.
export const useFieldCommentInputFocusGuard = (
  focusId: string,
  componentType: FocusComponentType,
) => {
  const { pushFocusItemToFocusStack } = usePushFocusItemToFocusStack();
  const { removeFocusItemFromFocusStackById } =
    useRemoveFocusItemFromFocusStackById();

  const onFocus = useCallback(() => {
    pushFocusItemToFocusStack({
      focusId,
      component: {
        type: componentType,
        instanceId: focusId,
      },
      globalHotkeysConfig: {
        enableGlobalHotkeysConflictingWithKeyboard: false,
      },
    });
  }, [pushFocusItemToFocusStack, focusId, componentType]);

  const onBlur = useCallback(() => {
    removeFocusItemFromFocusStackById({ focusId });
  }, [removeFocusItemFromFocusStackById, focusId]);

  useEffect(() => {
    return () => removeFocusItemFromFocusStackById({ focusId });
  }, [removeFocusItemFromFocusStackById, focusId]);

  return { onFocus, onBlur };
};
