import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  eventName: string;
  participantFirstName: string;
  participantLastName: string;
  participantCity?: string | null;
  participantEmail: string;
  enrolledCount: number;
  capacity: number;
  participantUrl: string;
};

export default function AdminEnrollmentAlert({
  eventName,
  participantFirstName,
  participantLastName,
  participantCity,
  participantEmail,
  enrolledCount,
  capacity,
  participantUrl,
}: Props) {
  return (
    <BaseLayout preview={`Nouvelle inscription — ${eventName}`}>
      <Heading as="h2">Nouvelle inscription</Heading>
      <Text>
        <strong>
          {participantFirstName} {participantLastName}
        </strong>{" "}
        vient de s&apos;inscrire à <strong>{eventName}</strong>
        {participantCity ? ` depuis ${participantCity}` : ""}.
      </Text>

      <Section
        style={{
          backgroundColor: "#f5f5f4",
          borderRadius: 6,
          padding: "12px 16px",
          margin: "16px 0",
        }}
      >
        <Text style={{ fontSize: 13, color: "#44403c", margin: 0 }}>
          Email&nbsp;: {participantEmail}
          <br />
          {enrolledCount} inscrite{enrolledCount > 1 ? "s" : ""} sur {capacity}{" "}
          place{capacity > 1 ? "s" : ""}
        </Text>
      </Section>

      <Button
        href={participantUrl}
        style={{
          backgroundColor: "#0f172a",
          color: "#ffffff",
          padding: "10px 18px",
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Voir la fiche participante
      </Button>

      <Text style={{ fontSize: 12, color: "#71717a", marginTop: 24 }}>
        Tu reçois ce message car tu es destinataire des alertes pour cet
        événement. Tu peux te retirer dans Paramètres → Notifications.
      </Text>
    </BaseLayout>
  );
}

AdminEnrollmentAlert.PreviewProps = {
  eventName: "Workshop 100% Féminin",
  participantFirstName: "Yasmine",
  participantLastName: "Diallo",
  participantCity: "Paris",
  participantEmail: "yasmine@example.com",
  enrolledCount: 12,
  capacity: 30,
  participantUrl: "https://app.lespilotes.fr/admin/personnes/abc",
} satisfies Props;
