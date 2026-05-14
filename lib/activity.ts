import { supabase } from "./supabase";

export async function logActivity(
  teamId: string,
  userId: string,
  action: string,
) {
  await supabase.from("team_activity").insert({
    team_id: teamId,
    user_id: userId,
    action,
  });
}
