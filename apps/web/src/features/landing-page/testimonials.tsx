"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    quote:
      "The quality and craftsmanship of every piece exceeded my expectations. My home has never felt more like a sanctuary.",
    author: "Sarah Mitchell",
    role: "Interior Designer",
  },
  {
    id: 2,
    quote:
      "Lumière's customer service is exceptional. They helped me find the perfect pieces for my new apartment.",
    author: "James Chen",
    role: "Architect",
  },
  {
    id: 3,
    quote:
      "I've been a loyal customer for years. The attention to detail in every item is simply unmatched.",
    author: "Emma Thompson",
    role: "Design Blogger",
  },
];

export function Testimonial() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  };

  const next = () => {
    setCurrentIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));
  };

  const current = testimonials[currentIndex];

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            Recognition
          </p>
        </div>

        <div className="relative text-center">
          <Quote className="text-muted-foreground/30 mx-auto mb-6 h-8 w-8" />
          <blockquote className="mb-8">
            <p className="text-foreground text-xl leading-relaxed font-medium text-balance sm:text-2xl lg:text-3xl">
              {`"${current.quote}"`}
            </p>
          </blockquote>
          <div className="mb-8">
            <p className="text-foreground font-semibold">{current.author}</p>
            <p className="text-muted-foreground text-sm">{current.role}</p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous testimonial</span>
            </Button>
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentIndex ? "bg-foreground" : "bg-foreground/20"
                  }`}
                >
                  <span className="sr-only">Go to testimonial {index + 1}</span>
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next testimonial</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
