import { collectionRouter } from "./routers/collection";
import { productRouter } from "./routers/product";
import { createCallerFactory, createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  product: productRouter,
  collection: collectionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.product.all();
 *       ^? Product[]
 */
export const createCaller = createCallerFactory(appRouter);
