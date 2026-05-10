import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendMemberRemovedEmail(
  memberEmail: string,
  memberName: string,
  teamName: string,
) {
  await getResend().emails.send({
    from: "Founders Stack <onboarding@resend.dev>",
    to: memberEmail,
    subject: `You've been removed from ${teamName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="background: #18181b; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px;">
          <span style="color: white; font-weight: bold; font-size: 16px;">Founders Stack</span>
        </div>
        <h2 style="color: #18181b; margin-bottom: 8px;">You've been removed from a team</h2>
        <p style="color: #71717a;">Hi ${memberName},</p>
        <p style="color: #71717a;">You have been removed from the team <strong style="color: #18181b;">${teamName}</strong> on Founders Stack.</p>
        <p style="color: #71717a;">If you think this was a mistake, please contact your team owner.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 12px;">Founders Stack — Turn chaos into actions</p>
      </div>
    `,
  });
}

export async function sendLeaveRequestEmail(
  ownerEmail: string,
  ownerName: string,
  memberName: string,
  teamName: string,
  requestId: string,
) {
  await getResend().emails.send({
    from: "Founders Stack <onboarding@resend.dev>",
    to: ownerEmail,
    subject: `${memberName} wants to leave ${teamName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="background: #18181b; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px;">
          <span style="color: white; font-weight: bold; font-size: 16px;">Founders Stack</span>
        </div>
        <h2 style="color: #18181b; margin-bottom: 8px;">Leave request</h2>
        <p style="color: #71717a;">Hi ${ownerName},</p>
        <p style="color: #71717a;"><strong style="color: #18181b;">${memberName}</strong> has requested to leave the team <strong style="color: #18181b;">${teamName}</strong>.</p>
        <p style="color: #71717a;">Please log in to Founders Stack to approve or reject this request.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 12px;">Founders Stack — Turn chaos into actions</p>
      </div>
    `,
  });
}

export async function sendLeaveStatusEmail(
  memberEmail: string,
  memberName: string,
  teamName: string,
  approved: boolean,
) {
  await getResend().emails.send({
    from: "Founders Stack <onboarding@resend.dev>",
    to: memberEmail,
    subject: `Your leave request for ${teamName} was ${approved ? "approved" : "rejected"}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="background: #18181b; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px;">
          <span style="color: white; font-weight: bold; font-size: 16px;">Founders Stack</span>
        </div>
        <h2 style="color: #18181b; margin-bottom: 8px;">Leave request ${approved ? "approved" : "rejected"}</h2>
        <p style="color: #71717a;">Hi ${memberName},</p>
        <p style="color: #71717a;">Your request to leave <strong style="color: #18181b;">${teamName}</strong> has been <strong style="color: ${approved ? "#16a34a" : "#dc2626"};">${approved ? "approved" : "rejected"}</strong>.</p>
        ${approved ? '<p style="color: #71717a;">You have been removed from the team.</p>' : '<p style="color: #71717a;">You are still a member of the team.</p>'}
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="color: #a1a1aa; font-size: 12px;">Founders Stack — Turn chaos into actions</p>
      </div>
    `,
  });
}
