import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  heading: string;
  body: string;
  confirmUrl: string;
  declineUrl: string;
  isMinor?: boolean;
  customNote?: string;
  signature?: string;
  immersionName: string;
};

export default function J7Reminder({
  heading,
  body,
  confirmUrl,
  declineUrl,
  isMinor,
  customNote,
  signature,
  immersionName,
}: Props) {
  return (
    <BaseLayout preview={`Confirme ta venue à ${immersionName} — J-7`}>
      <Heading as="h2">{heading}</Heading>
      <Text style={{ whiteSpace: "pre-line" }}>{body}</Text>
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={confirmUrl} style={confirmButton}>
          ✓ Je serai là
        </Button>
        <span style={{ display: "inline-block", width: 12 }} />
        <Button href={declineUrl} style={declineButton}>
          ✗ Je me désiste
        </Button>
      </Section>
      {isMinor && (
        <Section
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: 6,
            padding: "12px 16px",
            margin: "20px 0",
          }}
        >
          <Text style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
            📄 <strong>Rappel mineure</strong> — n&apos;oublie pas d&apos;apporter
            l&apos;autorisation parentale signée le jour J.
          </Text>
        </Section>
      )}
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
      <Text style={{ fontSize: 13, color: "#71717a" }}>
        Sans réponse sous 24h, on te rappellera au téléphone pour s&apos;assurer que tout va bien.
      </Text>
      {signature && (
        <Text style={{ fontSize: 13, color: "#44403c", whiteSpace: "pre-line", marginTop: 24 }}>
          {signature}
        </Text>
      )}
    </BaseLayout>
  );
}

const confirmButton: React.CSSProperties = {
  backgroundColor: "#16a34a",
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: 8,
  fontWeight: 600,
  textDecoration: "none",
  fontSize: 14,
};

const declineButton: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#71717a",
  padding: "12px 22px",
  borderRadius: 8,
  fontWeight: 600,
  textDecoration: "none",
  fontSize: 14,
  border: "1px solid #e4e4e7",
};

J7Reminder.PreviewProps = {
  heading: "Plus qu'une semaine, Amadou !",
  body: "On a hâte de te voir à Workshop 100% Féminin, le samedi 18 avril 2026.\n\nConfirme ta présence en un clic :",
  immersionName: "Workshop 100% Féminin",
  confirmUrl: "https://example.com/confirm/abc",
  declineUrl: "https://example.com/decline/abc",
  isMinor: false,
} satisfies Props;
