
import { appRouter, createCaller } from "./root";
import {
  createCallerFactory,
  createTRPCContext,
  createOuterContext,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "./trpc";

import type { AppRouter } from "./root";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

/**
 * Inference helpers for input types
 * @example
 * type ProductByIdInput = RouterInputs['product']['byId']
 *      ^? { id: number }
 **/
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllProductsOutput = RouterOutputs['product']['all']
 *      ^? Product[]
 **/
type RouterOutputs = inferRouterOutputs<AppRouter>;

export {
  createTRPCContext,
  createOuterContext,
  createTRPCRouter,
  createCallerFactory,
  publicProcedure,
  protectedProcedure,
  appRouter,
  createCaller,
};
export type { AppRouter, RouterInputs, RouterOutputs };

// Client-safe schemas are available via "@ecommerce/api/schemas"
// Server-side query builders are available via "./lib" internal imports
