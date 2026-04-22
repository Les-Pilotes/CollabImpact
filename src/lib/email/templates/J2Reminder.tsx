import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  firstName: string;
  immersionName: string;
  dateLabel: string;
  address: string;
  confirmUrl: string;
};

export default function J2Reminder({
  firstName,
  immersionName,
  dateLabel,
  address,
  confirmUrl,
}: Props) {
  return (
    <BaseLayout preview={`Dernière confirmation pour ${immersionName}`}>
      <Heading as="h2">C&apos;est dans 2 jours, {firstName} !</Heading>
      <Text>
        Rendez-vous <strong>{dateLabel}</strong> pour <strong>{immersionName}</strong>.
        <br />
        📍 {address}
      </Text>
      <Text>Dernier check — confirme ta présence :</Text>
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={confirmUrl} style={button}>
          Je serai là
        </Button>
      </Section>
      <Text style={{ fontSize: 13, color: "#71717a" }}>
        Si tu ne peux plus venir, préviens-nous en répondant à ce mail — ça libère une place pour
        un autre jeune.
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

J2Reminder.PreviewProps = {
  firstName: "Amadou",
  immersionName: "Découverte métiers de la tech",
  dateLabel: "jeudi 12 juin 2026 à 14h",
  address: "1 rue de la Paix, 75002 Paris",
  confirmUrl: "https://example.com/confirm/abc",
} satisfies Props;
