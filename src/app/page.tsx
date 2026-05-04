import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <h1 className="text-3xl font-extrabold text-zinc-900">
        CollabImpact — Les Pilotes
      </h1>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/inscription">
          <Button size="lg">Je m&apos;inscris</Button>
        </Link>
        <Link href="/admin/login">
          <Button size="lg" variant="outline">
            Espace admin
          </Button>
        </Link>
      </div>
    </div>
  );
}
