import { Button, Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  firstName: string | null;
  loginUrl: string;
  invitedByName?: string | null;
};

export default function AdminInvitation({
  firstName,
  loginUrl,
  invitedByName,
}: Props) {
  const greeting = firstName ? `Bienvenue ${firstName} 👋` : "Bienvenue 👋";
  return (
    <BaseLayout preview="Tu viens d'être ajouté(e) à l'admin Les Pilotes">
      <Heading as="h2">{greeting}</Heading>
      <Text>
        {invitedByName ? `${invitedByName} t'a` : "Tu viens d'être"} ajouté(e) à
        l&apos;espace admin de Les Pilotes. Tu peux dès maintenant te connecter
        pour gérer les événements, les inscriptions, suivre les feedbacks et
        recevoir les notifications de l&apos;équipe.
      </Text>
      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={loginUrl} style={button}>
          Me connecter à l&apos;admin
        </Button>
      </Section>
      <Text style={{ fontSize: 13, color: "#71717a" }}>
        La connexion se fait <strong>uniquement avec ton compte Google
        @les-pilotes.fr</strong>. Aucun mot de passe à créer, aucun lien
        magique : c&apos;est plus simple et plus sûr.
      </Text>
      <Text style={{ fontSize: 13, color: "#71717a" }}>
        Une question ? Réponds à ce mail, on est là.
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

AdminInvitation.PreviewProps = {
  firstName: "Bocar",
  loginUrl: "https://workshop.les-pilotes.fr/admin/login",
  invitedByName: "Amadou",
} satisfies Props;
