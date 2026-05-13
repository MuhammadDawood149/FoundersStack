import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, teamName, inviteLink } = await req.json();
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await resend.emails.send({
      from: "Founders Stack <onboarding@resend.dev>",
      to: email,
      subject: `You're invited to join ${teamName} on Founders Stack`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <div style="background: #18181b; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px;">
            <span style="color: white; font-weight: bold; font-size: 16px;">Founders Stack</span>
          </div>
          <h2 style="color: #18181b; margin-bottom: 8px;">You've been invited!</h2>
          <p style="color: #71717a;">You've been invited to join the team <strong style="color: #18181b;">${teamName}</strong> on Founders Stack.</p>
          <p style="color: #71717a;">Click the button below to join:</p>
          <a href="${inviteLink}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Join Team
          </a>
          <p style="color: #a1a1aa; font-size: 12px; margin-top: 24px;">This link expires in 7 days.</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">Founders Stack — Turn chaos into actions</p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return Response.json({ error: message }, { status: 500 });
  }
}
