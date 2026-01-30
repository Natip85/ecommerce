"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import type { CartItem } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { env } from "@/env";
import { useTRPC } from "@/trpc";

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

type ShippingAddress = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type CheckoutFormProps = {
  cartItems: CartItem[];
  onSuccess: (orderId: string) => void;
};

export function CheckoutForm({ cartItems, onSuccess }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [address, setAddress] = useState<ShippingAddress>({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  const trpc = useTRPC();

  const createPaymentIntent = useMutation(
    trpc.order.createPaymentIntent.mutationOptions({
      onSuccess: (data) => {
        setClientSecret(data.clientSecret);
        setOrderId(data.orderId);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create payment intent");
      },
    })
  );

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !address.name ||
      !address.email ||
      !address.line1 ||
      !address.city ||
      !address.state ||
      !address.postalCode
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create payment intent
    createPaymentIntent.mutate({
      items: cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      shippingAddress: address,
    });
  };

  const updateAddress = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  // Show shipping form if we don't have a client secret yet
  if (!clientSecret || !orderId) {
    return (
      <form
        onSubmit={handleAddressSubmit}
        className="space-y-6"
      >
        <div className="border-border bg-card rounded-xl border p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">Shipping Information</h2>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={address.name}
                  onChange={(e) => updateAddress("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={address.email}
                  onChange={(e) => updateAddress("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={address.phone}
                onChange={(e) => updateAddress("phone", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="line1">Address Line 1 *</Label>
              <Input
                id="line1"
                placeholder="123 Main St"
                value={address.line1}
                onChange={(e) => updateAddress("line1", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="line2">Address Line 2 (optional)</Label>
              <Input
                id="line2"
                placeholder="Apt 4B"
                value={address.line2}
                onChange={(e) => updateAddress("line2", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={address.city}
                  onChange={(e) => updateAddress("city", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="NY"
                  value={address.state}
                  onChange={(e) => updateAddress("state", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">ZIP Code *</Label>
                <Input
                  id="postalCode"
                  placeholder="10001"
                  value={address.postalCode}
                  onChange={(e) => updateAddress("postalCode", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="h-12 w-full gap-2 text-base font-semibold"
          disabled={createPaymentIntent.isPending}
        >
          {createPaymentIntent.isPending ?
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          : <>Continue to Payment</>}
        </Button>
      </form>
    );
  }

  // Show payment form once we have the client secret
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0f172a",
            colorBackground: "#ffffff",
            colorText: "#0f172a",
            colorDanger: "#ef4444",
            fontFamily: "system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
      }}
    >
      <PaymentForm
        orderId={orderId}
        onSuccess={onSuccess}
        address={address}
      />
    </Elements>
  );
}

type PaymentFormProps = {
  orderId: string;
  onSuccess: (orderId: string) => void;
  address: ShippingAddress;
};

function PaymentForm({ orderId, onSuccess, address }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/${orderId}`,
        receipt_email: address.email,
      },
      redirect: "if_required",
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setErrorMessage(error.message ?? "An error occurred with your payment");
      } else {
        setErrorMessage("An unexpected error occurred");
      }
      setIsProcessing(false);
    } else {
      // Payment succeeded without redirect
      onSuccess(orderId);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Shipping Address Summary */}
      <div className="border-border bg-card rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">Shipping Address</h2>
          <span className="text-xs font-medium text-emerald-600">Confirmed</span>
        </div>
        <Separator className="my-4" />
        <div className="text-muted-foreground text-sm">
          <p className="text-foreground font-medium">{address.name}</p>
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.city}, {address.state} {address.postalCode}
          </p>
          <p>{address.email}</p>
        </div>
      </div>

      {/* Payment Element */}
      <div className="border-border bg-card rounded-xl border p-6">
        <h2 className="text-foreground mb-4 text-lg font-semibold">Payment Details</h2>
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
        {errorMessage && (
          <div className="bg-destructive/10 text-destructive mt-4 rounded-lg p-3 text-sm">
            {errorMessage}
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="h-12 w-full gap-2 text-base font-semibold"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ?
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        : <>
            <Lock className="h-4 w-4" />
            Pay Now
          </>
        }
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        Your payment is secured with 256-bit SSL encryption
      </p>
    </form>
  );
}
