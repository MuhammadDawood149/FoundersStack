"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    handleJoin();
  }, []);

  const handleJoin = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        localStorage.setItem("pendingInviteToken", token || "");
        router.push("/auth");
        return;
      }

      if (!token) {
        setStatus("error");
        setMessage("Invalid invite link.");
        return;
      }

      const { data: invite, error } = await supabase
        .from("team_invites")
        .select("*")
        .eq("token", token)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !invite) {
        setStatus("error");
        setMessage("This invite link is invalid or has expired.");
        return;
      }

      const { data: existing } = await supabase
        .from("team_members2")
        .select("id")
        .eq("team_id", invite.team_id)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        setStatus("success");
        setMessage("You are already a member of this team!");
        setTimeout(() => router.push("/team"), 2000);
        return;
      }

      await supabase.from("team_members2").insert({
        team_id: invite.team_id,
        user_id: user.id,
        role: "member",
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
      });

      await supabase
        .from("team_invites")
        .update({ used: true })
        .eq("id", invite.id);

      setStatus("success");
      setMessage("You joined the team successfully!");
      setTimeout(() => router.push("/team"), 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setStatus("error");
      setMessage(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="text-5xl mb-4">
          {status === "loading" && "⏳"}
          {status === "success" && "🎉"}
          {status === "error" && "❌"}
        </div>
        <h2 className="text-lg font-bold text-zinc-900 mb-2">
          {status === "loading" && "Joining team..."}
          {status === "success" && "Welcome to the team!"}
          {status === "error" && "Something went wrong"}
        </h2>
        <p className="text-sm text-zinc-500">{message}</p>
        {status === "error" && (
          <button
            onClick={() => router.push("/")}
            className="mt-4 w-full h-11 bg-black text-white rounded-xl text-sm font-medium"
          >
            Go Home
          </button>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center">
          <div className="text-zinc-400 text-sm">Loading...</div>
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
