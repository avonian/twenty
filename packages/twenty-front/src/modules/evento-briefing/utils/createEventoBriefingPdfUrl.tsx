import { pdf } from '@react-pdf/renderer';

import { EventoBriefingDocument } from '@/evento-briefing/components/EventoBriefingDocument';
import { type EventoBriefingData } from '@/evento-briefing/types/EventoBriefingData';

// Renders the briefing to a PDF blob (same @react-pdf/renderer pattern as
// Twenty's note export) and returns an object URL the caller opens in a new tab,
// where the browser's PDF viewer lets the user preview, print or save it.
export const createEventoBriefingPdfUrl = async (
  data: EventoBriefingData,
): Promise<string> => {
  const blob = await pdf(<EventoBriefingDocument data={data} />).toBlob();

  return URL.createObjectURL(blob);
};
