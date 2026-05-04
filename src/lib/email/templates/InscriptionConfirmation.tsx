import { Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  firstName: string;
  eventName: string;
  eventDate: string;
  eventAddress: string;
};

export default function InscriptionConfirmation({
  firstName,
  eventName,
  eventDate,
  eventAddress,
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
