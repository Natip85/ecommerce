import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="bg-accent relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Content */}
          <div className="max-w-xl">
            <p className="text-muted-foreground mb-4 text-sm font-medium tracking-widest uppercase">
              New Collection 2026
            </p>
            <h1 className="text-foreground mb-6 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Welcome to a new dimension of home decor
            </h1>
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              Lumière blends intricate design, considered function and luxury materials to transform
              your home and awaken your senses.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="gap-2"
                asChild
              >
                <Link href="/shop">
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
              >
                <Link href="#collections">
                  Explore Collections
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative aspect-square lg:aspect-[4/5]">
            <div className="bg-muted absolute inset-0 overflow-hidden rounded-2xl">
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
