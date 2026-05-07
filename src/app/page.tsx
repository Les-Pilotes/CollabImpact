import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-zinc-900">
          Workshop 100% Féminin by Les Pilotes
        </h1>
        <p className="text-lg text-zinc-500">
          Une journée d&apos;immersion professionnelle pour explorer ton avenir
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <Link href="/inscription">
          <Button size="lg" variant="gradient">
            Je m&apos;inscris au Workshop 100% Féminin
          </Button>
        </Link>
        <Link href="/admin">
          <Button size="lg" variant="outline">
            Espace admin
          </Button>
        </Link>
      </div>
    </div>
  );
}
