import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";

export default async function ProfileRedirect() {
  const user = await requireUser();
  redirect(user.username ? `/@${user.username}` : "/settings/profile");
}
