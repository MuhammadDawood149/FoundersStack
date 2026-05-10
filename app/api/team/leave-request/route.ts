import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendLeaveRequestEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { teamId, teamName, memberName, ownerEmail, ownerName } =
      await req.json();
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("team_leave_requests")
      .insert({ team_id: teamId, user_id: user.id })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    await sendLeaveRequestEmail(
      ownerEmail,
      ownerName,
      memberName,
      teamName,
      data.id,
    );

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
