import { Categories } from "@/features/landing-page/categories";
import { FeatureBanner } from "@/features/landing-page/feature-banner";
import { FeaturedProducts } from "@/features/landing-page/featured-products";
import { Hero } from "@/features/landing-page/hero";
import { Newsletter } from "@/features/landing-page/newsletter";
import { Testimonial } from "@/features/landing-page/testimonials";

export default function Home() {
  return (
    <div className="flex-1">
      <Hero />
      <Categories />
      <FeaturedProducts />
      <Testimonial />
      <FeatureBanner />
      <Newsletter />
    </div>
  );
}
