import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  heading: string;
  body: string;
  immersionName: string;
  confirmUrl: string;
  declineUrl: string;
  isMinor?: boolean;
  customNote?: string;
  signature?: string;
};

export default function J2Reminder({
  heading,
  body,
  immersionName,
  confirmUrl,
  declineUrl,
  isMinor,
  customNote,
  signature,
}: Props) {
  return (
    <BaseLayout preview={`Dernière confirmation pour ${immersionName}`}>
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
            📄 <strong>N&apos;oublie pas l&apos;autorisation parentale signée</strong> —
            sans ce document tu ne pourras pas participer.
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
        Si tu ne peux plus venir, préviens-nous tout de suite — ça libère une place pour quelqu&apos;un d&apos;autre.
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

J2Reminder.PreviewProps = {
  heading: "C'est dans 2 jours, Amadou !",
  body: "Rendez-vous samedi 18 avril 2026 à 9h30 pour Workshop 100% Féminin.\n📍 9 rue de Vaugirard, 75006 Paris",
  immersionName: "Workshop 100% Féminin",
  confirmUrl: "https://example.com/confirm/abc",
  declineUrl: "https://example.com/decline/abc",
  isMinor: false,
} satisfies Props;
