import { Heading, Section, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  heading: string;
  body: string;
  eventName: string;
  customNote?: string;
  signature?: string;
};

export default function InscriptionConfirmation({
  heading,
  body,
  eventName,
  customNote,
  signature,
}: Props) {
  return (
    <BaseLayout preview={`Inscription confirmée — ${eventName}`}>
      <Heading as="h2">{heading}</Heading>
      <Text style={{ whiteSpace: "pre-line" }}>{body}</Text>
      {customNote && (
        <Section
          style={{
            backgroundColor: "#f5f5f4",
            borderRadius: 6,
            padding: "12px 16px",
            margin: "16px 0",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: "#44403c",
              margin: 0,
              whiteSpace: "pre-line",
            }}
          >
            {customNote}
          </Text>
        </Section>
      )}
      <Text>À très bientôt, l&apos;équipe Les Pilotes 💛</Text>
      {signature && (
        <Text style={{ fontSize: 13, color: "#44403c", whiteSpace: "pre-line", marginTop: 24 }}>
          {signature}
        </Text>
      )}
    </BaseLayout>
  );
}

InscriptionConfirmation.PreviewProps = {
  heading: "Bienvenue Yasmine !",
  body: "Ton inscription au Workshop 100% Féminin le samedi 18 avril 2026 à La Cité Audacieuse est bien enregistrée.\n\nOn a hâte de te retrouver.",
  eventName: "Workshop 100% Féminin",
} satisfies Props;
