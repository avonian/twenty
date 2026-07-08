import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { type APP_LOCALES } from 'twenty-shared/translations';

type NoteReplyNotificationEmailProps = {
  // Who wrote the reply that triggered this email.
  authorName: string;
  // Title of the root note/comment the reply belongs to (may be empty).
  noteTitle: string;
  // The reply text (already truncated by the caller if long).
  replyText: string;
  // Link to the record whose Notes tab holds the thread.
  link: string;
  locale: keyof typeof APP_LOCALES;
};

// Flamagas: sent to every participant of a note thread (owner + prior repliers)
// when someone else adds a reply. Copy is Spanish on purpose (Flamagas team).
export const NoteReplyNotificationEmail = ({
  authorName,
  noteTitle,
  replyText,
  link,
  locale,
}: NoteReplyNotificationEmailProps) => {
  const intro =
    noteTitle.length > 0
      ? `${authorName} respondió en la nota «${noteTitle}»:`
      : `${authorName} respondió en una conversación en la que participas:`;
  const quote = `«${replyText}»`;

  return (
    <BaseEmail locale={locale}>
      <Title value="Nueva respuesta 💬" />
      <MainText>{intro}</MainText>
      <MainText>{quote}</MainText>
      <br />
      <CallToAction href={link} value="Ver la conversación" />
      <br />
      <br />
    </BaseEmail>
  );
};

NoteReplyNotificationEmail.PreviewProps = {
  authorName: 'Ana García',
  noteTitle: 'Seguimiento distribuidor',
  replyText: '¿Confirmamos la reunión para el jueves?',
  link: 'https://app.twenty.com/object/evento/123',
  locale: 'es-ES',
} as NoteReplyNotificationEmailProps;

export default NoteReplyNotificationEmail;
