import { collectionRouter } from "./routers/collection";
import { orderRouter } from "./routers/order";
import { productRouter } from "./routers/product";
import { createCallerFactory, createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  product: productRouter,
  collection: collectionRouter,
  order: orderRouter,
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
