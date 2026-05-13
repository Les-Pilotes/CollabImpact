import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    // V2 event-scoped IA: anciennes routes globales redirigent vers la liste des events.
    // Au sein d'un event, les sous-pages remplacent les anciennes pages globales.
    return [
      { source: "/admin/participants", destination: "/admin/events", permanent: false },
      { source: "/admin/participants/:path*", destination: "/admin/events", permanent: false },
      { source: "/admin/participantes", destination: "/admin/events", permanent: false },
      { source: "/admin/participantes/:path*", destination: "/admin/events", permanent: false },
      { source: "/admin/taches", destination: "/admin/events", permanent: false },
      { source: "/admin/taches/:path*", destination: "/admin/events", permanent: false },
      { source: "/admin/appels", destination: "/admin/events", permanent: false },
      { source: "/admin/appels/:path*", destination: "/admin/events", permanent: false },
      { source: "/admin/impact", destination: "/admin/events", permanent: false },
      { source: "/admin/impact/:path*", destination: "/admin/events", permanent: false },
    ];
  },
};

export default nextConfig;
