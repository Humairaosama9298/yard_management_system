import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// This is a server component – runs on the server before rendering.
export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
  // No UI is rendered because redirect always throws.
  return null;
}
