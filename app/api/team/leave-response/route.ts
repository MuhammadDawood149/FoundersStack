import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendLeaveStatusEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const {
      requestId,
      approved,
      memberEmail,
      memberName,
      teamName,
      teamId,
      userId,
    } = await req.json();
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (approved) {
      // Remove member from team
      await supabase
        .from("team_members2")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", userId);
    }

    // Update request status
    await supabase
      .from("team_leave_requests")
      .update({ status: approved ? "approved" : "rejected" })
      .eq("id", requestId);

    await sendLeaveStatusEmail(memberEmail, memberName, teamName, approved);

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
