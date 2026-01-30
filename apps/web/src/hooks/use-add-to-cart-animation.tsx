"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { createPortal } from "react-dom";

// =============================================================================
// FLYING CART ANIMATION COMPONENT
// =============================================================================

type FlyingCartIconProps = {
  startPos: { x: number; y: number };
  onComplete: () => void;
};

/**
 * Flying cart icon that animates from a starting position to the header cart icon.
 * Used to provide visual feedback when adding items to cart.
 */
export const FlyingCartIcon = ({ startPos, onComplete }: FlyingCartIconProps) => {
  const [mounted, setMounted] = useState(false);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    const cartIcon = document.getElementById("header-cart-icon");
    if (cartIcon) {
      const rect = cartIcon.getBoundingClientRect();
      setTargetPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, []);

  if (!mounted || !targetPos) return null;

  return createPortal(
    <motion.div
      className="bg-primary text-primary-foreground pointer-events-none fixed z-9999 flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
      initial={{
        left: startPos.x,
        top: startPos.y,
        x: "-50%",
        y: "-50%",
        scale: 1,
        opacity: 1,
      }}
      animate={{
        left: targetPos.x,
        top: targetPos.y,
        scale: 0.4,
        opacity: 0,
      }}
      transition={{
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
        scale: { duration: 0.65, ease: "easeIn" },
        opacity: { duration: 0.5, delay: 0.15 },
      }}
      onAnimationComplete={onComplete}
    >
      <ShoppingCart className="h-4 w-4" />
    </motion.div>,
    document.body
  );
};

// =============================================================================
// HOOK FOR ADD TO CART ANIMATION
// =============================================================================

type UseAddToCartAnimationReturn = {
  /** Whether the animation is currently playing */
  isAnimating: boolean;
  /** The starting position for the animation */
  animationStartPos: { x: number; y: number };
  /**
   * Trigger the animation from a specific element.
   * Pass the element (button, container, etc.) that should be the starting point.
   */
  triggerAnimation: (element: HTMLElement | null) => void;
  /**
   * Trigger the animation from a mouse event.
   * Uses the event target as the starting point.
   */
  triggerAnimationFromEvent: (e: React.MouseEvent) => void;
  /** Callback to stop the animation (called internally on complete) */
  stopAnimation: () => void;
  /** The FlyingCartIcon component to render when animating */
  AnimationComponent: React.ReactNode;
};

/**
 * Hook to manage the "add to cart" flying animation.
 *
 * @example
 * ```tsx
 * const { triggerAnimation, AnimationComponent } = useAddToCartAnimation();
 * const buttonRef = useRef<HTMLButtonElement>(null);
 *
 * const handleAddToCart = () => {
 *   triggerAnimation(buttonRef.current);
 *   // ... actual add to cart logic
 * };
 *
 * return (
 *   <>
 *     <button ref={buttonRef} onClick={handleAddToCart}>Add to Cart</button>
 *     {AnimationComponent}
 *   </>
 * );
 * ```
 */
export const useAddToCartAnimation = (): UseAddToCartAnimationReturn => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStartPos, setAnimationStartPos] = useState({ x: 0, y: 0 });

  const triggerAnimation = useCallback((element: HTMLElement | null) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      setAnimationStartPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setIsAnimating(true);
    }
  }, []);

  const triggerAnimationFromEvent = useCallback((e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      setAnimationStartPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setIsAnimating(true);
    }
  }, []);

  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const AnimationComponent =
    isAnimating ?
      <FlyingCartIcon
        startPos={animationStartPos}
        onComplete={stopAnimation}
      />
    : null;

  return {
    isAnimating,
    animationStartPos,
    triggerAnimation,
    triggerAnimationFromEvent,
    stopAnimation,
    AnimationComponent,
  };
};
