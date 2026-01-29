"use client";

import { createTRPCContext } from "@trpc/tanstack-react-query";

import type { AppRouter } from "@ecommerce/api";

export { skipToken } from "@tanstack/react-query";
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
export { useTRPCClient } from "./react";
