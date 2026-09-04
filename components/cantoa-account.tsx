"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Check,
  Crown,
  Infinity as InfinityIcon,
  LogIn,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type CantoaAccountInfo = {
  plan: string;
  status: string;
  minutesRemaining: number | null;
  currentPeriodEnd?: string | null;
  isOwner: boolean;
  freeSongClaimed?: boolean;
  freeSongsRemaining?: number;
  billingCurrency?: string | null;
  billingAmountMinor?: number | null;
  cloudConfigured?: boolean;
};

export function useCantoaSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(() => !getSupabaseBrowser());
  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!client) return;
    void client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = client.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready, configured: Boolean(getSupabaseBrowser()) };
}

export default function CantoaAccount({
  open,
  onClose,
  session,
  account,
}: {
  open: boolean;
  onClose: () => void;
  session: Session | null;
  account: CantoaAccountInfo | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (!open) return null;
  const client = getSupabaseBrowser();
  const metadata = session?.user.user_metadata || {};
  const displayName =
    metadata.full_name ||
    metadata.name ||
    session?.user.email?.split("@")[0] ||
    "Cantoa creator";
  const avatar = metadata.avatar_url || metadata.picture;
  const monthlyAllowance =
    account?.plan === "Creator" ? 40 : account?.plan === "Studio" ? 120 : null;
  const resetLabel = account?.currentPeriodEnd
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
        new Date(account.currentPeriodEnd),
      )
    : null;

  const submit = async () => {
    if (!client) {
      setMessage("Account service is not connected on this deployment.");
      return;
    }
    setBusy(true);
    setMessage("");
    const result =
      mode === "signin"
        ? await client.auth.signInWithPassword({ email, password })
        : await client.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session)
      setMessage("Check your email to confirm your Cantoa account.");
    else {
      setMessage("You are signed in. Your library is connected.");
      setPassword("");
    }
  };
  const googleSignIn = async () => {
    if (!client) {
      setMessage("Account service is not connected on this deployment.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setBusy(false);
      setMessage(error.message);
    }
  };
  const signOut = async () => {
    await client?.auth.signOut();
    setMessage("You are signed out.");
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
      >
        <button
          className="modal-close"
          aria-label="Close account"
          onClick={onClose}
        >
          <X />
        </button>
        {session ? (
          <>
            <div className="account-identity">
              <span>
                {avatar ? <img src={avatar} alt="" /> : <UserCircle />}
              </span>
              <div>
                <p>{account?.isOwner ? "CANTOA OWNER" : "CANTOA ACCOUNT"}</p>
                <h2 id="account-title">{displayName}</h2>
                <b>{session.user.email}</b>
              </div>
            </div>
            <div className="account-plan-summary">
              <Crown />
              <span>
                <b>{account?.plan || "Explore"} membership</b>
                {account?.isOwner ? (
                  <small>
                    <InfinityIcon /> Unlimited owner access
                  </small>
                ) : (
                  <small>
                    {account?.plan === "Explore"
                      ? `${account?.freeSongsRemaining ?? 2} free music creation${(account?.freeSongsRemaining ?? 2) === 1 ? "" : "s"} remaining · up to 2 minutes each`
                      : `${account?.minutesRemaining ?? 0} of ${monthlyAllowance ?? 0} music-generation minutes left`}
                  </small>
                )}
              </span>
            </div>
            {account && !account.isOwner && (account.plan === "Creator" || account.plan === "Studio") && (
              <div className="account-usage-summary" aria-label="Monthly membership usage">
                <div className="account-usage-heading">
                  <span>Monthly usage</span>
                  {resetLabel && <small>Resets {resetLabel}</small>}
                </div>
                <div className="account-usage-row">
                  <span>Music generation</span>
                  <b>{account.minutesRemaining ?? 0} / {monthlyAllowance} min remaining</b>
                </div>
                <div className="account-usage-meter" aria-hidden="true">
                  <span
                    style={{
                      width: `${Math.max(0, Math.min(100, ((account.minutesRemaining ?? 0) / (monthlyAllowance || 1)) * 100))}%`,
                    }}
                  />
                </div>
                <div className="account-usage-row included">
                  <span>Reels & video exports from finished songs</span>
                  <b>Included</b>
                </div>
                <small className="account-usage-note">Creating new AI audio uses music-generation minutes. Reels, square videos, lyric videos, gift pages, and re-exports from an existing finished song do not.</small>
              </div>
            )}
            {account && !account.isOwner && (account.plan === "Creator" || account.plan === "Studio") && (
              <a
                className="account-manage-membership"
                href="/api/stripe/customer-portal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Settings />
                <span>
                  <b>Manage Membership</b>
                  <small>Cancel, update payment method, or view invoices</small>
                </span>
              </a>
            )}
            <div className="account-benefits">
              <div>
                <ShieldCheck />
                <span>
                  <b>{account?.cloudConfigured === false ? "Cloud storage setup needed" : "Private cloud library"}</b>{account?.cloudConfigured === false ? "Authentication works, but server-side cloud storage is not fully configured on this deployment." : "Your songs stay connected to this account."}
                </span>
              </div>
              <div>
                <Check />
                <span>
                  <b>Device continuity</b>Open your saved work on another
                  signed-in device.
                </span>
              </div>
            </div>
            <button className="account-submit secondary" onClick={signOut}>
              <LogOut /> Sign out
            </button>
            {message && <p className="account-message">{message}</p>}
          </>
        ) : (
          <>
            <div className="modal-heading">
              <p>YOUR CANTOA ACCOUNT</p>
              <h2 id="account-title">Save your music securely.</h2>
              <span>
                Build your song first, then sign in when you are ready to generate it. Your first 2 music creations are free (up to 2 minutes each), and your library stays private.
              </span>
            </div>
            <button
              className="google-signin"
              disabled={busy}
              onClick={googleSignIn}
            >
              <strong>G</strong> Continue with Google
            </button>
            <div className="auth-divider">
              <span>or use email</span>
            </div>
            <div className="auth-tabs">
              <button
                className={mode === "signin" ? "active" : ""}
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
              <button
                className={mode === "signup" ? "active" : ""}
                onClick={() => setMode("signup")}
              >
                Create account
              </button>
            </div>
            <label className="auth-field">
              <span>
                <Mail /> Email
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="auth-field">
              <span>
                <ShieldCheck /> Password
              </span>
              <input
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                placeholder="At least 8 characters"
              />
            </label>
            <button
              className="account-submit"
              disabled={busy || !email || password.length < 8}
              onClick={submit}
            >
              <LogIn />{" "}
              {busy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in securely"
                  : "Create my account"}
            </button>
            {message && <p className="account-message">{message}</p>}
            <small className="privacy-note">
              Cantoa never stores your password. Authentication is handled by
              the connected Supabase project.
            </small>
          </>
        )}
        <a className="support-link" href="mailto:support@cantoamusic.com">
          Need help? support@cantoamusic.com
        </a>
      </section>
    </div>
  );
}
