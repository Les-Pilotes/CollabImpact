import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  firstName: string;
  eventName: string;
  resumeUrl: string;
};

export default function ResumeInscription({
  firstName,
  eventName,
  resumeUrl,
}: Props) {
  return (
    <BaseLayout preview={`Reprends ton inscription à ${eventName}`}>
      <Heading as="h2">Re-bonjour {firstName} 👋</Heading>
      <Text>
        Tu as demandé à reprendre ton inscription à <strong>{eventName}</strong>.
        Clique ci-dessous : on pré-remplit tes infos automatiquement, tu n&apos;auras
        que la partie « cet événement » à compléter.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={resumeUrl} style={button}>
          Reprendre mon inscription
        </Button>
      </Section>
      <Text style={{ fontSize: 13, color: "#71717a" }}>
        Ce lien est valable <strong>15 minutes</strong>. Si tu n&apos;as pas fait cette
        demande, ignore ce mail — personne ne peut reprendre ton compte sans
        cliquer dessus.
      </Text>
    </BaseLayout>
  );
}

const button: React.CSSProperties = {
  backgroundColor: "#f97316",
  color: "#ffffff",
  padding: "14px 28px",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 15,
  textDecoration: "none",
};

ResumeInscription.PreviewProps = {
  firstName: "Marie",
  eventName: "Workshop découverte tech",
  resumeUrl: "https://example.com/inscription/abc?resume=xyz",
} satisfies Props;
