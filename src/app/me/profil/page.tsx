import { requireJeune } from "@/lib/auth";
import ProfilForm from "@/components/jeune/ProfilForm";

export const metadata = { title: "Mon profil" };

export default async function ProfilPage() {
  const { dbUser } = await requireJeune();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-zinc-900">Mon profil</h1>
        <p className="text-zinc-500 mt-1">
          Ces informations nous permettent de mieux te connaître et de
          personnaliser ton parcours.
        </p>
      </div>
      <ProfilForm user={dbUser} />
    </div>
  );
}
