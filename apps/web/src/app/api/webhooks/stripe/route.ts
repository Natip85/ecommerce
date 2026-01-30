/* eslint-disable no-console */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { db } from "@ecommerce/db";
import { orders } from "@ecommerce/db/schema/order";
import { env } from "@ecommerce/env/server";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

/**
 * Stripe webhook handler
 * Receives events from Stripe and updates order status accordingly
 *
 * Important: This endpoint uses raw body for signature verification
 */
export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Stripe Webhook] Signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object;
        await handlePaymentIntentCanceled(paymentIntent);
        break;
      }

      default:
        console.warn(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Stripe Webhook] Error handling event: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook handler failed: ${errorMessage}` }, { status: 500 });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.warn(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);

  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    console.error(`[Stripe Webhook] No orderId in metadata for PaymentIntent: ${paymentIntent.id}`);
    return;
  }

  await db
    .update(orders)
    .set({
      status: "paid",
      paidAt: new Date(),
    })
    .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

  console.warn(`[Stripe Webhook] Order ${orderId} marked as paid`);
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.warn(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);

  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    console.error(`[Stripe Webhook] No orderId in metadata for PaymentIntent: ${paymentIntent.id}`);
    return;
  }

  await db
    .update(orders)
    .set({
      status: "failed",
    })
    .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

  console.warn(`[Stripe Webhook] Order ${orderId} marked as failed`);
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.warn(`[Stripe Webhook] Payment canceled: ${paymentIntent.id}`);

  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    console.error(`[Stripe Webhook] No orderId in metadata for PaymentIntent: ${paymentIntent.id}`);
    return;
  }

  await db
    .update(orders)
    .set({
      status: "cancelled",
    })
    .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

  console.warn(`[Stripe Webhook] Order ${orderId} marked as cancelled`);
}
