import { auth } from "@ecommerce/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const isAdmin = session.user.role === "admin";

  if (!isAdmin) {
    redirect("/");
  }
  redirect("/admin/dashboard");
}
