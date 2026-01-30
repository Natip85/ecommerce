import { Heart, Leaf, Sparkles, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const values = [
  {
    icon: Sparkles,
    title: "Craftsmanship",
    description:
      "Every piece is carefully selected for its exceptional quality and timeless design.",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    description:
      "We partner with ethical suppliers committed to environmentally responsible practices.",
  },
  {
    icon: Heart,
    title: "Passion",
    description: "Our love for beautiful things drives us to curate only the finest products.",
  },
  {
    icon: Star,
    title: "Excellence",
    description: "From sourcing to delivery, we maintain the highest standards at every step.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="from-muted/50 to-background relative overflow-hidden bg-linear-to-b py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-foreground text-4xl font-light tracking-tight sm:text-5xl lg:text-6xl">
            Our Story
          </h1>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed sm:text-xl">
            Founded with a passion for bringing light into everyday moments, Lumière curates
            exceptional products that blend elegance with functionality.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
              Our Mission
            </h2>
            <Separator className="mx-auto mt-4 w-12" />
          </div>
          <p className="text-foreground/80 mt-8 text-center text-lg leading-relaxed">
            At Lumière, we believe that the objects we surround ourselves with should inspire and
            delight. We search the world for pieces that tell a story—items crafted with care,
            designed with intention, and built to last. Our mission is simple: to illuminate your
            life with beauty and quality.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
              What We Stand For
            </h2>
            <Separator className="mx-auto mt-4 w-12" />
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card
                key={value.title}
                className="bg-background/60 border-0 shadow-sm"
              >
                <CardContent className="pt-6 text-center">
                  <div className="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                    <value.icon className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-foreground mt-4 font-medium">{value.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Promise Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-foreground text-2xl font-light tracking-tight sm:text-3xl">
            The Lumière Promise
          </h2>
          <p className="text-muted-foreground mt-6 leading-relaxed">
            Every product in our collection has been thoughtfully chosen to meet our exacting
            standards. We stand behind everything we sell with exceptional customer service and a
            commitment to your complete satisfaction.
          </p>
          <div className="text-muted-foreground mt-10 flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="bg-primary h-1.5 w-1.5 rounded-full" />
              <span>Free Shipping Over $100</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-primary h-1.5 w-1.5 rounded-full" />
              <span>30-Day Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-primary h-1.5 w-1.5 rounded-full" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
