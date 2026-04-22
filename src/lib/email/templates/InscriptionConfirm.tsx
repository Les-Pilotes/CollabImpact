import { Heading, Text } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

type Props = {
  firstName: string;
  immersionName: string;
  companyName: string;
  dateLabel: string; // ex. "jeudi 12 juin 2026 à 14h"
  address: string;
};

export default function InscriptionConfirm({
  firstName,
  immersionName,
  companyName,
  dateLabel,
  address,
}: Props) {
  return (
    <BaseLayout preview={`Ton inscription à "${immersionName}" est confirmée`}>
      <Heading as="h2">Salut {firstName} 👋</Heading>
      <Text>
        Ton inscription à l&apos;immersion <strong>{immersionName}</strong> chez{" "}
        <strong>{companyName}</strong> est bien reçue.
      </Text>
      <Text>
        📅 <strong>{dateLabel}</strong>
        <br />
        📍 {address}
      </Text>
      <Text>
        On te recontacte dans les prochains jours pour finaliser ta participation. Réponds bien aux
        mails de confirmation à J-7 et J-2 pour garder ta place.
      </Text>
      <Text>À très vite !</Text>
    </BaseLayout>
  );
}

InscriptionConfirm.PreviewProps = {
  firstName: "Amadou",
  immersionName: "Découverte métiers de la tech",
  companyName: "Ledger",
  dateLabel: "jeudi 12 juin 2026 à 14h",
  address: "1 rue de la Paix, 75002 Paris",
} satisfies Props;
