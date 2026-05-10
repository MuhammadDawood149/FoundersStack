"use client";

import { useState, useEffect } from "react";
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
  profiles?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
};

export default function TeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    setUser(user);

    // Check if user is in a team
    const { data: membership } = await supabase
      .from("team_members2")
      .select("team_id, role")
      .eq("user_id", user.id)
      .single();

    if (membership) {
      // Load team details
      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("id", membership.team_id)
        .single();
      setTeam(teamData);

      // Load members
      const { data: membersData } = await supabase
        .from("team_members2")
        .select("*")
        .eq("team_id", membership.team_id);
      setMembers(membersData || []);
    }

    setLoading(false);
  };

  const createTeam = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      // Create team
      const { data: newTeam, error: teamError } = await supabase
        .from("teams")
        .insert({ name: teamName.trim(), created_by: user.id })
        .select()
        .single();

      console.log("Team creation result:", newTeam, teamError);

      if (teamError) throw new Error(teamError.message);

      // Add creator as owner
      const { error: memberError } = await supabase
        .from("team_members2")
        .insert({ team_id: newTeam.id, user_id: user.id, role: "owner" });

      console.log("Member creation error:", memberError);

      if (memberError) throw new Error(memberError.message);

      setTeam(newTeam);
      setMembers([
        {
          id: "",
          user_id: user.id,
          role: "owner",
          joined_at: new Date().toISOString(),
        },
      ]);
      showToast("Team created!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      alert("Error: " + message);
    }
    setCreating(false);
  };

  const generateInvite = async () => {
    if (!team) return;
    try {
      const { data, error } = await supabase
        .from("team_invites")
        .insert({ team_id: team.id, created_by: user.id })
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
    const text = `Hey! Join my team "${team?.name}" on Founders Stack. Click this link to join: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = `Join my team on Founders Stack`;
    const body = `Hey!\n\nI'd like you to join my team "${team?.name}" on Founders Stack.\n\nClick this link to join:\n${inviteLink}\n\nThe link expires in 7 days.`;
    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
  };

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === user.id) {
      alert("You can't remove yourself.");
      return;
    }
    if (!confirm("Remove this member from the team?")) return;
    await supabase.from("team_members2").delete().eq("id", memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    showToast("Member removed");
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
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-white flex justify-between items-end px-4 pb-4 w-full h-28 border-b border-zinc-200 sticky top-0 z-30">
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">
            Founders Stack
          </p>
          <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 leading-tight">
            Team
          </h1>
        </div>
        <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold mb-1">
          FS
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        {/* No team yet */}
        {!team && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div className="text-center mb-6">
              <span className="material-symbols-outlined text-5xl text-zinc-300 mb-3 block">
                group
              </span>
              <h2 className="text-lg font-bold text-zinc-900 mb-1">
                Create your team
              </h2>
              <p className="text-sm text-zinc-500">
                Collaborate with teammates and share actions
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Team name e.g. Acme Founders"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createTeam()}
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-400 transition"
              />
              <button
                onClick={createTeam}
                disabled={creating || !teamName.trim()}
                className="w-full h-12 bg-black text-white rounded-xl font-semibold text-sm hover:bg-zinc-800 disabled:opacity-40 transition"
              >
                {creating ? "Creating..." : "Create Team"}
              </button>
            </div>
          </div>
        )}

        {/* Team exists */}
        {team && (
          <div className="space-y-4">
            {/* Team card */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900">{team.name}</h2>
                  <p className="text-xs text-zinc-400">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Members list */}
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
                          {member.user_id === user.id ? "You" : `Member`}
                        </p>
                        <p className="text-xs text-zinc-400 capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    {member.user_id !== user.id &&
                      team.created_by === user.id && (
                        <button
                          onClick={() =>
                            removeMember(member.id, member.user_id)
                          }
                          className="text-xs text-red-500 hover:text-red-700 transition"
                        >
                          Remove
                        </button>
                      )}
                  </div>
                ))}
              </div>

              {/* Invite button */}
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

            {/* Invite link card */}
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

                <div className="grid grid-cols-3 gap-2">
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
                    onClick={shareViaEmail}
                    className="h-11 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      mail
                    </span>
                    Email
                  </button>
                  <button
                    onClick={copyLink}
                    className="h-11 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-50 transition flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      content_copy
                    </span>
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
