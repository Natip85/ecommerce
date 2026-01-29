"use client";

import { ArrowRight, Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const products = [
  {
    id: 1,
    name: "Sculptural Lounge Chair",
    price: 1290,
    image:
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80",
    category: "Seating",
  },
  {
    id: 2,
    name: "Ceramic Table Lamp",
    price: 345,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
    category: "Lighting",
  },
  {
    id: 3,
    name: "Woven Wool Throw",
    price: 195,
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    category: "Textiles",
  },
  {
    id: 4,
    name: "Oak Side Table",
    price: 485,
    image:
      "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80",
    category: "Tables",
  },
];

export function FeaturedProducts() {
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id],
    );
  };

  return (
    <section id="shop" className="py-16 sm:py-24 bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="mb-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Featured Products
            </h2>
            <p className="text-muted-foreground">
              Handpicked pieces loved by our community.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/shop">
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="group">
              <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-muted">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      favorites.includes(product.id)
                        ? "fill-destructive text-destructive"
                        : "text-foreground"
                    }`}
                  />
                </button>
                <div className="absolute bottom-3 left-3 right-3 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <Button className="w-full gap-2" size="sm">
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart
                  </Button>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {product.category}
                </p>
                <h3 className="mb-1 font-medium text-foreground">
                  {product.name}
                </h3>
                <p className="font-semibold text-foreground">
                  ${product.price.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
