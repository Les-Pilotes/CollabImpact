import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Newspaper, ExternalLink } from "lucide-react";

export const metadata = { title: "Feed — Admin" };

const KIND_LABELS: Record<string, string> = {
  news: "Actu",
  post_linkedin: "LinkedIn",
  video: "Vidéo",
  article: "Article",
};

export default async function AdminFeedPage() {
  const { admin } = await requireAdmin();

  const updates = await prisma.update.findMany({
    where: { organisationId: admin.organisationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { immersion: { select: { companyName: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-extrabold text-zinc-900">Feed</h1>
        <Link href="/admin/feed/nouveau">
          <Button variant="gradient" size="sm">
            <Plus className="w-4 h-4" /> Nouvelle publication
          </Button>
        </Link>
      </div>

      {updates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <Newspaper className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 mb-4">Aucune publication pour l&apos;instant.</p>
          <Link href="/admin/feed/nouveau">
            <Button variant="gradient">Créer une publication</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => (
            <div
              key={update.id}
              className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-zinc-900">{update.title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {KIND_LABELS[update.kind] ?? update.kind}
                    </Badge>
                    {update.publishedAt ? (
                      <Badge variant="success" className="text-xs">
                        Publié
                      </Badge>
                    ) : (
                      <Badge variant="muted" className="text-xs">
                        Brouillon
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 line-clamp-1">{update.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                    {update.immersion && (
                      <span>🏢 {update.immersion.companyName}</span>
                    )}
                    {update.publishedAt && (
                      <span>
                        {new Date(update.publishedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>
                {update.sourceUrl && (
                  <a
                    href={update.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-[var(--brand-orange)] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
