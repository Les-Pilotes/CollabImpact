import { Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  subject: string;
  body: string;
  signature?: string;
};

export default function CustomMessage({ subject, body, signature }: Props) {
  return (
    <BaseLayout preview={subject}>
      <Heading as="h2" style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
        {subject}
      </Heading>
      <Text style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>{body}</Text>
      <Text style={{ color: "#44403c" }}>L&apos;équipe Les Pilotes 💛</Text>
      {signature && (
        <Text style={{ fontSize: 13, color: "#44403c", whiteSpace: "pre-line", marginTop: 24 }}>
          {signature}
        </Text>
      )}
    </BaseLayout>
  );
}

CustomMessage.PreviewProps = {
  subject: "Infos pratiques pour samedi",
  body: "Bonjour,\n\nRappel pour l'événement de samedi : rendez-vous à 9h30 au 12 rue de la Paix, Paris 1er.\n\nN'oubliez pas d'apporter une pièce d'identité.",
} satisfies Props;
