import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  firstName: string;
  immersionName: string;
  companyName: string;
  dateLabel: string;
  confirmUrl: string;
  declineUrl: string;
  isMinor?: boolean;
};

export default function J7Reminder({
  firstName,
  immersionName,
  companyName,
  dateLabel,
  confirmUrl,
  declineUrl,
  isMinor,
}: Props) {
  return (
    <BaseLayout preview={`Confirme ta venue à ${immersionName} — J-7`}>
      <Heading as="h2">Plus qu&apos;une semaine, {firstName} !</Heading>
      <Text>
        On a hâte de te voir à <strong>{immersionName}</strong> chez <strong>{companyName}</strong>
        , le <strong>{dateLabel}</strong>.
      </Text>
      <Text>Confirme ta présence en un clic :</Text>
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
      <Text style={{ fontSize: 13, color: "#71717a" }}>
        Sans réponse sous 24h, on te rappellera au téléphone pour s&apos;assurer que tout va bien.
      </Text>
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
  firstName: "Amadou",
  immersionName: "Workshop 100% Féminin",
  companyName: "Les Pilotes",
  dateLabel: "samedi 18 avril 2026",
  confirmUrl: "https://example.com/confirm/abc",
  declineUrl: "https://example.com/decline/abc",
  isMinor: false,
} satisfies Props;
