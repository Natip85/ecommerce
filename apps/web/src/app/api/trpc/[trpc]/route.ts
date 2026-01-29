import { appRouter, createTRPCContext } from "@ecommerce/api";
import { auth } from "@ecommerce/auth";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";


function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });
      return createTRPCContext({ session });
    },
  });
}
export { handler as GET, handler as POST };
