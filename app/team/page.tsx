"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Team = {
  id: string;
  name: string;
  created_by: string;
};

type Member = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email?: string;
  full_name?: string;
};

type LeaveRequest = {
  id: string;
  team_id: string;
  user_id: string;
  status: string;
  created_at: string;
};

export default function TeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadTeamDetails = useCallback(async (teamId: string) => {
    const { data: membersData } = await supabase
      .from("team_members2")
      .select("*")
      .eq("team_id", teamId);
    setMembers(membersData || []);

    const { data: requests } = await supabase
      .from("team_leave_requests")
      .select("*")
      .eq("team_id", teamId)
      .eq("status", "pending");
    setLeaveRequests(requests || []);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    setUser(user);

    const { data: memberships } = await supabase
      .from("team_members2")
      .select("team_id, role")
      .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
      const teamIds = memberships.map((m) => m.team_id);
      const { data: teamsData } = await supabase
        .from("teams")
        .select("*")
        .in("id", teamIds);

      setTeams(teamsData || []);
      if (teamsData && teamsData.length > 0) {
        setActiveTeam(teamsData[0]);
        await loadTeamDetails(teamsData[0].id);
      }
    }

    setLoading(false);
  }, [router, loadTeamDetails]);
  // Check if current user was removed from the team
  useEffect(() => {
    if (!activeTeam || !user) return;

    const channel = supabase
      .channel(`my_membership_${activeTeam.id}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "team_members2",
        },
        (payload: any) => {
          // If current user was removed, reload their teams
          if (payload.old?.user_id === user.id) {
            showToast("You have been removed from the team");
            setTimeout(() => loadData(), 1500);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTeam, user, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription for member changes
  useEffect(() => {
    if (!activeTeam) return;

    const channel = supabase
      .channel(`team_members_${activeTeam.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_members2",
          filter: `team_id=eq.${activeTeam.id}`,
        },
        () => {
          loadTeamDetails(activeTeam.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTeam, loadTeamDetails]);

  const switchTeam = async (team: Team) => {
    setActiveTeam(team);
    setShowInvite(false);
    setInviteLink("");
    await loadTeamDetails(team.id);
  };

  const createTeam = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      const { data: newTeam, error: teamError } = await supabase
        .from("teams")
        .insert({ name: teamName.trim(), created_by: user.id })
        .select()
        .single();

      if (teamError) throw new Error(teamError.message);

      const { error: memberError } = await supabase
        .from("team_members2")
        .insert({
          team_id: newTeam.id,
          user_id: user.id,
          role: "owner",
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
        });

      if (memberError) throw new Error(memberError.message);

      setTeams((prev) => [...prev, newTeam]);
      setActiveTeam(newTeam);
      setMembers([
        {
          id: "",
          user_id: user.id,
          role: "owner",
          joined_at: new Date().toISOString(),
          email: user.email,
          full_name: user.user_metadata?.full_name,
        },
      ]);
      setTeamName("");
      setShowCreateForm(false);
      showToast("Team created!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      alert("Error: " + message);
    }
    setCreating(false);
  };

  const deleteTeam = async () => {
    if (!activeTeam) return;
    if (members.length > 1) {
      alert("Remove all members before deleting the team.");
      return;
    }
    if (!confirm(`Delete "${activeTeam.name}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await supabase.from("team_invites").delete().eq("team_id", activeTeam.id);
      await supabase
        .from("team_members2")
        .delete()
        .eq("team_id", activeTeam.id);
      await supabase.from("teams").delete().eq("id", activeTeam.id);

      const remainingTeams = teams.filter((t) => t.id !== activeTeam.id);
      setTeams(remainingTeams);

      if (remainingTeams.length > 0) {
        setActiveTeam(remainingTeams[0]);
        await loadTeamDetails(remainingTeams[0].id);
      } else {
        setActiveTeam(null);
        setMembers([]);
      }

      setShowInvite(false);
      setInviteLink("");
      showToast("Team deleted");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      alert("Error: " + message);
    }
    setDeleting(false);
  };

  const generateInvite = async () => {
    if (!activeTeam) return;
    try {
      const { data, error } = await supabase
        .from("team_invites")
        .insert({ team_id: activeTeam.id, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/join?token=${data.token}`;
      setInviteLink(link);
      setShowInvite(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      alert("Error: " + message);
    }
  };

  const shareViaWhatsApp = () => {
    const text = `Hey! Join my team "${activeTeam?.name}" on Founders Stack. Click this link to join: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaEmail = async () => {
    if (!inviteEmail.trim()) {
      alert("Please enter an email address");
      return;
    }
    setSendingEmail(true);
    try {
      const { sendEmail } = await import("@/lib/emailjs");
      await sendEmail(
        inviteEmail,
        `You're invited to join ${activeTeam?.name} on Founders Stack`,
        `Hey!\n\nYou've been invited to join the team "${activeTeam?.name}" on Founders Stack.\n\nClick this link to join:\n${inviteLink}\n\nThe link expires in 7 days.\n\nFounders Stack - Turn chaos into actions`,
      );
      showToast("Invite sent!");
      setInviteEmail("");
    } catch (err: unknown) {
      console.error("EmailJS error:", err);
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      alert("Error: " + message);
    }
    setSendingEmail(false);
  };

  const removeMember = async (member: Member) => {
    if (member.user_id === user.id) {
      alert("You can't remove yourself.");
      return;
    }
    if (!confirm("Remove this member from the team?")) return;

    try {
      const { error } = await supabase
        .from("team_members2")
        .delete()
        .eq("id", member.id);

      if (error) throw new Error(error.message);

      if (member.email) {
        const { sendEmail } = await import("@/lib/emailjs");
        await sendEmail(
          member.email,
          `You've been removed from ${activeTeam?.name}`,
          `Hi ${member.full_name || "there"},\n\nYou have been removed from the team "${activeTeam?.name}" on Founders Stack.\n\nIf you think this was a mistake, please contact your team owner.`,
        );
      }

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      showToast("Member removed and notified by email");
    } catch (err: unknown) {
      console.error("Remove error:", err);
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      alert("Error: " + message);
    }
  };

  const requestLeave = async (team: Team) => {
    if (!confirm(`Request to leave "${team.name}"? The owner must approve.`))
      return;

    try {
      const ownerMember = members.find((m) => m.role === "owner");
      await fetch("/api/team/leave-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          teamName: team.name,
          memberName: user.user_metadata?.full_name || user.email,
          ownerEmail: ownerMember?.email || "",
          ownerName: ownerMember?.full_name || "Owner",
        }),
      });
      showToast("Leave request sent to owner");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      alert("Error: " + message);
    }
  };

  const handleLeaveResponse = async (
    request: LeaveRequest,
    approved: boolean,
  ) => {
    try {
      const member = members.find((m) => m.user_id === request.user_id);
      await fetch("/api/team/leave-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          approved,
          memberEmail: member?.email || "",
          memberName: member?.full_name || "Member",
          teamName: activeTeam?.name,
          teamId: request.team_id,
          userId: request.user_id,
        }),
      });

      setLeaveRequests((prev) => prev.filter((r) => r.id !== request.id));
      if (approved) {
        setMembers((prev) => prev.filter((m) => m.user_id !== request.user_id));
      }
      showToast(approved ? "Member removed and notified" : "Request rejected");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      alert("Error: " + message);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    showToast("Link copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      <header className="bg-white flex justify-between items-end px-4 pb-4 w-full h-28 border-b border-zinc-200 sticky top-0 z-30">
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">
            Founders Stack
          </p>
          <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 leading-tight">
            Teams
          </h1>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="mb-1 h-9 px-4 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-700 transition flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Team
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        {showCreateForm && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-zinc-900 mb-3">Create new team</h2>
            <input
              type="text"
              placeholder="Team name e.g. Acme Founders"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTeam()}
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-400 transition mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={createTeam}
                disabled={creating || !teamName.trim()}
                className="flex-1 h-11 bg-black text-white rounded-xl font-semibold text-sm hover:bg-zinc-800 disabled:opacity-40 transition"
              >
                {creating ? "Creating..." : "Create Team"}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setTeamName("");
                }}
                className="h-11 px-4 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {teams.length === 0 && !showCreateForm && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm text-center">
            <span className="material-symbols-outlined text-5xl text-zinc-300 mb-3 block">
              group
            </span>
            <h2 className="text-lg font-bold text-zinc-900 mb-1">
              No teams yet
            </h2>
            <p className="text-sm text-zinc-500 mb-4">
              Create a team to collaborate with teammates
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="h-11 px-6 bg-black text-white rounded-xl font-semibold text-sm hover:bg-zinc-800 transition"
            >
              Create your first team
            </button>
          </div>
        )}

        {teams.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => switchTeam(team)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeTeam?.id === team.id
                    ? "bg-zinc-900 text-white"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {team.name}
              </button>
            ))}
          </div>
        )}

        {activeTeam && (
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {activeTeam.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-900">
                      {activeTeam.name}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Delete team — only owner, only if no other members */}
                  {activeTeam.created_by === user.id && members.length <= 1 && (
                    <button
                      onClick={deleteTeam}
                      disabled={deleting}
                      className="text-xs text-red-500 hover:text-red-700 transition border border-red-200 px-3 py-1 rounded-lg disabled:opacity-40"
                    >
                      {deleting ? "Deleting..." : "Delete Team"}
                    </button>
                  )}
                  {/* Leave button for non-owners */}
                  {activeTeam.created_by !== user.id && (
                    <button
                      onClick={() => requestLeave(activeTeam)}
                      className="text-xs text-red-500 hover:text-red-700 transition border border-red-200 px-3 py-1 rounded-lg"
                    >
                      Request Leave
                    </button>
                  )}
                </div>
              </div>

              {leaveRequests.length > 0 &&
                activeTeam.created_by === user.id && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-xs font-bold text-yellow-700 mb-2">
                      ⏳ Pending leave requests
                    </p>
                    {leaveRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between py-1"
                      >
                        <p className="text-xs text-zinc-600">
                          {members.find((m) => m.user_id === req.user_id)
                            ?.full_name || "A member"}{" "}
                          wants to leave
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLeaveResponse(req, true)}
                            className="text-xs text-green-600 font-semibold hover:text-green-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleLeaveResponse(req, false)}
                            className="text-xs text-red-500 font-semibold hover:text-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              <div className="space-y-2 mb-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-zinc-100 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px] text-zinc-500">
                          person
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-800">
                          {member.user_id === user.id
                            ? "You"
                            : member.full_name || "Member"}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {member.email || member.role}
                        </p>
                      </div>
                    </div>
                    {member.user_id !== user.id &&
                      activeTeam.created_by === user.id && (
                        <button
                          onClick={() => removeMember(member)}
                          className="text-xs text-red-500 hover:text-red-700 transition"
                        >
                          Remove
                        </button>
                      )}
                  </div>
                ))}
              </div>

              <button
                onClick={generateInvite}
                className="w-full h-11 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>
                Invite Teammate
              </button>
            </div>

            {showInvite && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-zinc-900 mb-1">
                  Invite link
                </h3>
                <p className="text-xs text-zinc-400 mb-3">
                  Expires in 7 days. Share with your teammate.
                </p>
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-600 break-all mb-4">
                  {inviteLink}
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="email"
                    placeholder="teammate@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 transition"
                  />
                  <button
                    onClick={shareViaEmail}
                    disabled={sendingEmail}
                    className="h-10 px-4 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 disabled:opacity-40 transition"
                  >
                    {sendingEmail ? "..." : "Send Email"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={shareViaWhatsApp}
                    className="h-11 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 transition flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      chat
                    </span>
                    WhatsApp
                  </button>
                  <button
                    onClick={copyLink}
                    className="h-11 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-50 transition flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      content_copy
                    </span>
                    Copy Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
