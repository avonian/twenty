import { useState } from 'react';
import { IconPrinter } from 'twenty-ui-deprecated/display';
import { Button } from 'twenty-ui-deprecated/input';

import { useEventoBriefingData } from '@/evento-briefing/hooks/useEventoBriefingData';
import { createEventoBriefingPdfUrl } from '@/evento-briefing/utils/createEventoBriefingPdfUrl';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

type PrintBriefingButtonProps = { eventoId: string };

// Flamagas: header action on an Evento that downloads a printable PDF briefing
// (evento + distribuidor + país + performances + notes).
export const PrintBriefingButton = ({ eventoId }: PrintBriefingButtonProps) => {
  const { data, isReady } = useEventoBriefingData(eventoId);
  const [isGenerating, setIsGenerating] = useState(false);
  const { enqueueErrorSnackBar } = useSnackBar();

  const handleClick = async () => {
    if (!isReady || data === null) {
      return;
    }

    // Open the tab synchronously within the click gesture so popup blockers
    // don't reject it after the async PDF render.
    const pdfTab = window.open('', '_blank');

    setIsGenerating(true);
    try {
      const url = await createEventoBriefingPdfUrl(data);

      if (pdfTab !== null) {
        pdfTab.location.href = url;
      } else {
        window.open(url, '_blank');
      }

      // Give the new tab time to load before releasing the blob.
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      pdfTab?.close();
      enqueueErrorSnackBar({ message: 'No se pudo generar el briefing' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      Icon={IconPrinter}
      size="small"
      variant="primary"
      accent="blue"
      title="Imprimir Briefing"
      disabled={!isReady || isGenerating}
      onClick={handleClick}
    />
  );
};
