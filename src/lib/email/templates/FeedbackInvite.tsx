import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  heading: string;
  body: string;
  immersionName: string;
  feedbackUrl: string;
  customNote?: string;
  signature?: string;
};

export default function FeedbackInvite({
  heading,
  body,
  immersionName,
  feedbackUrl,
  customNote,
  signature,
}: Props) {
  return (
    <BaseLayout preview={`Ton avis sur ${immersionName}`}>
      <Heading as="h2">{heading}</Heading>
      <Text style={{ whiteSpace: "pre-line" }}>{body}</Text>
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={feedbackUrl} style={button}>
          Donner mon avis
        </Button>
      </Section>
      {customNote && (
        <Section
          style={{
            backgroundColor: "#f5f5f4",
            borderRadius: 6,
            padding: "12px 16px",
            margin: "16px 0",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: "#44403c",
              margin: 0,
              whiteSpace: "pre-line",
            }}
          >
            {customNote}
          </Text>
        </Section>
      )}
      <Text style={{ fontSize: 13, color: "#71717a" }}>Lien valable 30 jours.</Text>
      {signature && (
        <Text style={{ fontSize: 13, color: "#44403c", whiteSpace: "pre-line", marginTop: 24 }}>
          {signature}
        </Text>
      )}
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
  heading: "Merci d'être venue, Marie !",
  body: "On aimerait connaître ton ressenti sur Workshop découverte tech. 3 minutes maximum, c'est très utile pour améliorer les prochaines éditions.",
  immersionName: "Workshop découverte tech",
  feedbackUrl: "https://example.com/feedback/abc",
} satisfies Props;
