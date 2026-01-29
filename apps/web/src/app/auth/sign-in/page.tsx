import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import AuthTabs from "@/features/auth/auth-tabs";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Image Panel */}
      <div className="relative hidden lg:block lg:w-1/2 xl:w-3/5">
        <Image
          src="/images/sign-in-img.png"
          alt="Elegant home interior"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-foreground/10" />

        {/* Brand & Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-10 xl:p-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-card w-fit">
            <div className="w-8 h-8 bg-card rounded-full flex items-center justify-center">
              <span className="text-foreground font-serif text-sm font-semibold">
                L
              </span>
            </div>
            <span className="text-xl font-serif tracking-wide">Lumière</span>
          </Link>

          {/* Quote */}
          <div className="max-w-lg">
            <blockquote className="text-card text-2xl xl:text-3xl font-serif leading-relaxed text-balance">
              "Transform your space into a sanctuary of style and comfort."
            </blockquote>
            <p className="text-card/80 mt-4 text-sm tracking-wide uppercase">
              Curated home decor for modern living
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Panel */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
              <span className="text-background font-serif text-sm font-semibold">
                L
              </span>
            </div>
            <span className="text-xl font-serif tracking-wide text-foreground">
              Lumière
            </span>
          </Link>
        </header>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 lg:mb-12 w-fit text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to store
          </Link>

          {/* Dynamic Card Container - Your forms go here */}
          <div className="w-full flex justify-center mx-auto max-w-md">
            {/* Placeholder for your dynamic cards */}
            <AuthTabs />
          </div>

          {/* Footer Links */}
          <div className="mt-10 lg:mt-12 space-y-4">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <span className="text-border">|</span>
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-border">|</span>
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Need help?
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Badges - Desktop */}
        <div className="hidden lg:flex items-center justify-center gap-8 py-6 border-t border-border px-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <span className="text-xs">Secure checkout</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
              />
            </svg>
            <span className="text-xs">Free shipping over $100</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            <span className="text-xs">30-day returns</span>
          </div>
        </div>
      </div>
    </div>
  );
}
