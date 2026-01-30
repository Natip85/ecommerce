import type { Route } from "next";
import Link from "next/link";

const categories = [
  {
    name: "Living Room",
    description: "8 Products",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    href: "#",
  },
  {
    name: "Bedroom",
    description: "12 Products",
    image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80",
    href: "#",
  },
  {
    name: "Lighting",
    description: "6 Products",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
    href: "#",
  },
];

export function Categories() {
  return (
    <section
      id="collections"
      className="bg-background py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Shop by Category
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Explore our curated collections designed to elevate every corner of your home.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href as Route}
              className="bg-muted group relative overflow-hidden rounded-xl"
            >
              <div className="aspect-4/5">
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="from-foreground/60 absolute inset-0 bg-linear-to-t to-transparent" />
              <div className="absolute right-0 bottom-0 left-0 p-6">
                <p className="text-background/70 text-xs font-medium tracking-wider uppercase">
                  {category.description}
                </p>
                <h3 className="text-background mt-1 text-xl font-semibold">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
