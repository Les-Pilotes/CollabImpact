"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-700 transition-colors"
    >
      Imprimer / PDF
    </button>
  );
}
