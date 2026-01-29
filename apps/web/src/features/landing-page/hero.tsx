import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Content */}
          <div className="max-w-xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              New Collection 2026
            </p>
            <h1 className="mb-6 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
              Welcome to a new dimension of home decor
            </h1>
            <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
              Lumière blends intricate design, considered function and luxury
              materials to transform your home and awaken your senses.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/shop">
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#collections">
                  Explore Collections
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative aspect-square lg:aspect-[4/5]">
            <div className="absolute inset-0 overflow-hidden rounded-2xl bg-muted">
              <img
                src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80"
                alt="Modern living room with elegant furniture"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
