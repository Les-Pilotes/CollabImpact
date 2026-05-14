import { Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  firstName: string;
  eventName: string;
  eventDate: string;
  eventAddress: string;
  customNote?: string;
};

export default function InscriptionConfirmation({
  firstName,
  eventName,
  eventDate,
  eventAddress,
  customNote,
}: Props) {
  return (
    <BaseLayout preview={`Bienvenue ${firstName} ! Ton inscription est confirmée.`}>
      <Heading as="h2">Bienvenue {firstName} !</Heading>
      <Text>
        Ton inscription au <strong>{eventName}</strong> le <strong>{eventDate}</strong> à{" "}
        <strong>{eventAddress}</strong> est bien enregistrée.
      </Text>
      <Text>
        On a hâte de te retrouver — en cas de question, réponds à cet email ou contacte-nous sur
        WhatsApp.
      </Text>
      {customNote && (
        <Section style={{ backgroundColor: "#f5f5f4", borderRadius: 6, padding: "12px 16px", margin: "16px 0" }}>
          <Text style={{ fontSize: 13, color: "#44403c", margin: 0, whiteSpace: "pre-line" }}>{customNote}</Text>
        </Section>
      )}
      <Text>À très bientôt, l&apos;équipe Les Pilotes 💛</Text>
    </BaseLayout>
  );
}

InscriptionConfirmation.PreviewProps = {
  firstName: "Yasmine",
  eventName: "Workshop 100% Féminin — La Cité Audacieuse",
  eventDate: "Samedi 18 avril 2026",
  eventAddress: "9 rue de Vaugirard, Paris 6",
} satisfies Props;
