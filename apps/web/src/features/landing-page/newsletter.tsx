"use client";

import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Join Our Newsletter
          </h2>
          <p className="text-muted-foreground mb-8">
            Receive 10% off your first order, exclusive updates, inspiration and more.
          </p>

          {submitted ?
            <div className="bg-background flex items-center justify-center gap-2 rounded-lg p-4">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                <Check className="text-primary-foreground h-4 w-4" />
              </div>
              <p className="text-foreground font-medium">{"Thank you for subscribing!"}</p>
            </div>
          : <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 sm:flex-row sm:gap-2"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="gap-2"
              >
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          }
        </div>
      </div>
    </section>
  );
}
