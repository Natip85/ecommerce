import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@ecommerce/auth";

export const { GET, POST } = toNextJsHandler(auth.handler);
