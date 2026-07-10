import { BaseEmail } from 'src/components/BaseEmail';
import { CallToAction } from 'src/components/CallToAction';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { type APP_LOCALES } from 'twenty-shared/translations';

type NoteReplyNotificationEmailProps = {
  // Who wrote the note/reply that triggered this email.
  authorName: string;
  // Title of the root note/comment the reply belongs to (may be empty).
  // Unused for a root note ('note' kind), where title == body.
  noteTitle: string;
  // The note or reply text (already truncated by the caller if long).
  bodyText: string;
  // Link to the record whose Notes tab holds the thread.
  link: string;
  // 'reply' = a reply inside an existing thread; 'note' = a brand-new first note
  // on a record (its owner is being notified).
  kind: 'note' | 'reply';
  locale: keyof typeof APP_LOCALES;
};

// Flamagas: sent to note-thread participants (owner + prior repliers) on a new
// reply, and to a record's owner on a brand-new first note. Copy is Spanish on
// purpose (Flamagas team).
export const NoteReplyNotificationEmail = ({
  authorName,
  noteTitle,
  bodyText,
  link,
  kind,
  locale,
}: NoteReplyNotificationEmailProps) => {
  const title = kind === 'note' ? 'Nueva nota 📝' : 'Nueva respuesta 💬';

  const intro =
    kind === 'note'
      ? `${authorName} escribió una nota:`
      : noteTitle.length > 0
        ? `${authorName} respondió en la nota «${noteTitle}»:`
        : `${authorName} respondió en una conversación en la que participas:`;
  const quote = `«${bodyText}»`;

  const callToAction = kind === 'note' ? 'Ver la nota' : 'Ver la conversación';

  return (
    <BaseEmail locale={locale}>
      <Title value={title} />
      <MainText>{intro}</MainText>
      <MainText>{quote}</MainText>
      <br />
      <CallToAction href={link} value={callToAction} />
      <br />
      <br />
    </BaseEmail>
  );
};

NoteReplyNotificationEmail.PreviewProps = {
  authorName: 'Ana García',
  noteTitle: 'Seguimiento distribuidor',
  bodyText: '¿Confirmamos la reunión para el jueves?',
  link: 'https://app.twenty.com/object/evento/123',
  kind: 'reply',
  locale: 'es-ES',
} as NoteReplyNotificationEmailProps;

export default NoteReplyNotificationEmail;
