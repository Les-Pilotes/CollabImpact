import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  firstName: string;
  immersionName: string;
  feedbackUrl: string;
  customNote?: string;
};

export default function FeedbackInvite({ firstName, immersionName, feedbackUrl, customNote }: Props) {
  return (
    <BaseLayout preview={`Ton avis sur ${immersionName}`}>
      <Heading as="h2">Merci d&apos;être venu(e), {firstName} !</Heading>
      <Text>
        On aimerait connaître ton ressenti sur <strong>{immersionName}</strong>. 3 minutes
        maximum, c&apos;est très utile pour améliorer les prochaines immersions.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={feedbackUrl} style={button}>
          Donner mon avis
        </Button>
      </Section>
      {customNote && (
        <Section style={{ backgroundColor: "#f5f5f4", borderRadius: 6, padding: "12px 16px", margin: "16px 0" }}>
          <Text style={{ fontSize: 13, color: "#44403c", margin: 0, whiteSpace: "pre-line" }}>{customNote}</Text>
        </Section>
      )}
      <Text style={{ fontSize: 13, color: "#71717a" }}>Lien valable 30 jours.</Text>
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

FeedbackInvite.PreviewProps = {
  firstName: "Amadou",
  immersionName: "Découverte métiers de la tech",
  feedbackUrl: "https://example.com/feedback/abc",
} satisfies Props;
