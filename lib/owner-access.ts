import { authenticatedUser } from "@/lib/supabase";
import { isCantoaOwner } from "@/lib/owner";

export async function ownerUser(request: Request) {
  const user = await authenticatedUser(request);
  return user && isCantoaOwner(user.email) ? user : null;
}
