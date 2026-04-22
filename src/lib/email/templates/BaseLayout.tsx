import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

type Props = {
  preview: string;
  children: ReactNode;
};

/**
 * Layout commun pour tous les mails transactionnels Les Pilotes.
 * Style minimal : on itérera sur le design après validation côté métier.
 */
export function BaseLayout({ preview, children }: Props) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section>
            <Text style={brand}>Les Pilotes</Text>
          </Section>
          <Hr style={hr} />
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            Les Pilotes — association d&apos;immersion professionnelle.
            <br />
            Tu reçois ce mail car tu es inscrit(e) à une immersion.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily: "system-ui, -apple-system, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 8,
  maxWidth: 560,
  margin: "0 auto",
  padding: "32px 24px",
};

const brand: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#0f172a",
  margin: 0,
};

const hr: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "20px 0",
};

const footer: React.CSSProperties = {
  fontSize: 12,
  color: "#71717a",
  lineHeight: 1.5,
};
