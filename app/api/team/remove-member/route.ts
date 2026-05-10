import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendMemberRemovedEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { memberId, memberEmail, memberName, teamName } = await req.json();
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("team_members2")
      .delete()
      .eq("id", memberId);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Send email notification
    if (memberEmail) {
      await sendMemberRemovedEmail(memberEmail, memberName, teamName);
    }

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
