import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  firstName: string;
  immersionName: string;
  companyName: string;
  dateLabel: string;
  confirmUrl: string;
};

export default function J7Reminder({
  firstName,
  immersionName,
  companyName,
  dateLabel,
  confirmUrl,
}: Props) {
  return (
    <BaseLayout preview={`Confirme ta venue à ${immersionName} — J-7`}>
      <Heading as="h2">Plus qu&apos;une semaine, {firstName} !</Heading>
      <Text>
        On a hâte de te voir à <strong>{immersionName}</strong> chez <strong>{companyName}</strong>
        , le <strong>{dateLabel}</strong>.
      </Text>
      <Text>Merci de confirmer ta présence en cliquant sur le bouton ci-dessous :</Text>
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={confirmUrl} style={button}>
          Je confirme ma venue
        </Button>
      </Section>
      <Text style={{ fontSize: 13, color: "#71717a" }}>
        Sans réponse sous 24h, ta place sera malheureusement réattribuée.
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

J7Reminder.PreviewProps = {
  firstName: "Amadou",
  immersionName: "Découverte métiers de la tech",
  companyName: "Ledger",
  dateLabel: "jeudi 12 juin 2026 à 14h",
  confirmUrl: "https://example.com/confirm/abc",
} satisfies Props;
