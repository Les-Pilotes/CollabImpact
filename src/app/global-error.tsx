"use client";

// Replaces the root layout entirely when it's the layout itself that fails,
// so it must not depend on globals.css or next/font — inline styles only.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#fafafa",
          color: "#18181b",
        }}
      >
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <p style={{ fontSize: "3.5rem", margin: "0 0 1rem" }}>😵</p>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 800, margin: "0 0 0.75rem" }}>
            Une erreur s&apos;est produite
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#52525b", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
            L&apos;application n&apos;a pas pu s&apos;afficher. Réessaie dans un instant.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#18181b",
              color: "white",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
