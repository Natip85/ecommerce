import Link from "next/link";

import type { Route } from "next";

const categories = [
  {
    name: "Living Room",
    description: "8 Products",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    href: "#",
  },
  {
    name: "Bedroom",
    description: "12 Products",
    image:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80",
    href: "#",
  },
  {
    name: "Lighting",
    description: "6 Products",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
    href: "#",
  },
];

export function Categories() {
  return (
    <section id="collections" className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl text-balance">
            Shop by Category
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Explore our curated collections designed to elevate every corner of
            your home.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href as Route}
              className="group relative overflow-hidden rounded-xl bg-muted"
            >
              <div className="aspect-[4/5]">
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-background/70">
                  {category.description}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-background">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
