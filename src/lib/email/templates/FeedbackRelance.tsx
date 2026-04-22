import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  firstName: string;
  immersionName: string;
  feedbackUrl: string;
};

export default function FeedbackRelance({ firstName, immersionName, feedbackUrl }: Props) {
  return (
    <BaseLayout preview={`Petit rappel — ton avis sur ${immersionName}`}>
      <Heading as="h2">{firstName}, 2 min de ton temps ?</Heading>
      <Text>
        On n&apos;a pas encore reçu ton retour sur <strong>{immersionName}</strong>. Ton avis
        compte beaucoup — même une courte réponse nous aide.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={feedbackUrl} style={button}>
          Répondre maintenant
        </Button>
      </Section>
      <Text style={{ fontSize: 13, color: "#71717a" }}>
        C&apos;est notre dernière relance, promis !
      </Text>
    </BaseLayout>
  );
}

const button: React.CSSProperties = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: 6,
  fontWeight: 600,
  textDecoration: "none",
};

FeedbackRelance.PreviewProps = {
  firstName: "Amadou",
  immersionName: "Découverte métiers de la tech",
  feedbackUrl: "https://example.com/feedback/abc",
} satisfies Props;
