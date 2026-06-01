import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  prenom: string;
  eventName: string;
  eventDate: string;
  pdfUrl: string;
  signature?: string;
};

export default function DroitsRelance({ prenom, eventName, eventDate, pdfUrl, signature }: Props) {
  return (
    <BaseLayout preview={`Rappel : autorisation parentale pour ${eventName}`}>
      <Heading as="h2">Rappel : autorisation parentale</Heading>
      <Text style={{ whiteSpace: "pre-line" }}>
        {`Bonjour ${prenom},

Tu es inscrite à l'immersion professionnelle "${eventName}" le ${eventDate}.

Comme tu es mineure, tes parents doivent signer l'autorisation parentale pour les droits à l'image. Pense à l'apporter signée le jour J — sans elle, tu ne pourras pas être prise en photo.`}
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={pdfUrl} style={button}>
          Télécharger l'autorisation parentale (PDF)
        </Button>
      </Section>
      <Text style={{ fontSize: 13, color: "#71717a" }}>
        Si tes parents ont déjà signé le formulaire, ignore ce message.
      </Text>
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

DroitsRelance.PreviewProps = {
  prenom: "Léa",
  eventName: "Workshop découverte tech",
  eventDate: "samedi 15 juin 2026",
  pdfUrl: "https://example.com/legal/adhesion-mineur.pdf",
} satisfies Props;
