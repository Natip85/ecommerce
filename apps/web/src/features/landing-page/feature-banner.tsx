import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function FeatureBanner() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative aspect-[16/9] sm:aspect-[21/9]">
        <img
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80"
          alt="Beautifully designed modern bedroom"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="mb-4 text-3xl font-semibold text-background sm:text-4xl lg:text-5xl text-balance">
            Escape reality without leaving your bedroom
          </h2>
          <p className="mb-6 max-w-xl text-background/80">
            Transform your space into a personal retreat with our curated
            bedroom collection.
          </p>
          <Button size="lg" asChild>
            <Link href="#">
              Explore Collection
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
