"use client";

import { useState } from "react";

type Props = {
  token: string;
  firstName: string;
  immersionName: string;
};

export default function FeedbackForm({ token, firstName, immersionName }: Props) {
  const [overallRating, setOverallRating] = useState<number>(0);
  const [orgRating, setOrgRating] = useState<number>(0);
  const [changedVision, setChangedVision] = useState<boolean | null>(null);
  const [favoriteMoment, setFavoriteMoment] = useState("");
  const [verbatim, setVerbatim] = useState("");
  const [improvements, setImprovements] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (overallRating === 0 || orgRating === 0 || changedVision === null) {
      setError("Merci de répondre à toutes les questions obligatoires.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallRating,
          orgRating,
          changedVision,
          favoriteMoment: favoriteMoment || undefined,
          verbatim: verbatim || undefined,
          improvements: improvements || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "40px 24px" }}>
        <p style={{ fontSize: 48 }}>🙏</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Merci, {firstName} !</h2>
        <p style={{ color: "#71717a" }}>Ton avis nous aide à améliorer les prochaines immersions.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <p style={{ color: "#71717a", marginBottom: 0 }}>
        Partage ton expérience sur <strong>{immersionName}</strong>. Ça prend 3 minutes !
      </p>

      {/* Overall rating */}
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>
          Note globale de l&apos;événement <span style={{ color: "#e11d48" }}>*</span>
        </legend>
        <StarSelector value={overallRating} onChange={setOverallRating} name="overallRating" />
      </fieldset>

      {/* Org rating */}
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>
          Organisation &amp; accueil <span style={{ color: "#e11d48" }}>*</span>
        </legend>
        <StarSelector value={orgRating} onChange={setOrgRating} name="orgRating" />
      </fieldset>

      {/* Changed vision */}
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>
          Ce workshop a changé ta vision du monde professionnel ?{" "}
          <span style={{ color: "#e11d48" }}>*</span>
        </legend>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Oui", value: true },
            { label: "Non", value: false },
          ].map(({ label, value }) => (
            <label
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontWeight: changedVision === value ? 600 : 400,
              }}
            >
              <input
                type="radio"
                name="changedVision"
                checked={changedVision === value}
                onChange={() => setChangedVision(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Favorite moment (optional) */}
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontWeight: 600 }}>Ton moment préféré ? (optionnel)</span>
        <textarea
          value={favoriteMoment}
          onChange={(e) => setFavoriteMoment(e.target.value)}
          rows={3}
          style={textareaStyle}
          placeholder="Ce qui t'a le plus marqué(e)…"
        />
      </label>

      {/* Verbatim (optional) */}
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontWeight: 600 }}>Un message pour l&apos;équipe ? (optionnel)</span>
        <textarea
          value={verbatim}
          onChange={(e) => setVerbatim(e.target.value)}
          rows={3}
          style={textareaStyle}
          placeholder="Ton ressenti général…"
        />
      </label>

      {/* Improvements (optional) */}
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontWeight: 600 }}>Ce qu&apos;on pourrait améliorer ? (optionnel)</span>
        <textarea
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          rows={3}
          style={textareaStyle}
          placeholder="Tes suggestions…"
        />
      </label>

      {error && (
        <p style={{ color: "#e11d48", fontSize: 14, margin: 0 }}>{error}</p>
      )}

      <button type="submit" disabled={submitting} style={buttonStyle}>
        {submitting ? "Envoi en cours…" : "Envoyer mon avis"}
      </button>
    </form>
  );
}

function StarSelector({
  value,
  onChange,
  name,
}: {
  value: number;
  onChange: (v: number) => void;
  name: string;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <label key={star} style={{ cursor: "pointer", fontSize: 28 }}>
          <input
            type="radio"
            name={name}
            value={star}
            checked={value === star}
            onChange={() => onChange(star)}
            style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
          />
          <span style={{ color: star <= value ? "#f59e0b" : "#d1d5db" }}>★</span>
        </label>
      ))}
    </div>
  );
}

const textareaStyle: React.CSSProperties = {
  border: "1px solid #e4e4e7",
  borderRadius: 6,
  padding: "8px 12px",
  fontFamily: "inherit",
  fontSize: 15,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: 6,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  fontSize: 15,
};
