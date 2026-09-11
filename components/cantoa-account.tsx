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
  currentPeriodEnd?: string | number | null;
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
    void client.auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .finally(() => setReady(true));
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (next) setSession(next);
      else if (event === "SIGNED_OUT") setSession(null);
      setReady(true);
    });
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [signupPendingEmail, setSignupPendingEmail] = useState("");
  const [message, setMessage] = useState("");
  if (!open) return null;
  const client = getSupabaseBrowser();
  const openMembershipPortal = async () => {
    if (!session) return;
    setMessage("Opening secure membership management…");
    const response = await fetch("/api/stripe/customer-portal", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.url) { window.location.href = data.url; return; }
    setMessage(data.error || "Membership management could not be opened.");
  };
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
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage("Enter your email address.");
      return;
    }
    if (password.length < 8) {
      setMessage("Use a password with at least 8 characters.");
      return;
    }
    if (mode === "signup") {
      if (signupName.trim().length < 2) {
        setMessage("Enter the name you want shown on your Cantoa account.");
        return;
      }
      if (password !== confirmPassword) {
        setMessage("The two passwords do not match.");
        return;
      }
    }
    setBusy(true);
    setMessage("");
    setSignupPendingEmail("");
    const result =
      mode === "signin"
        ? await client.auth.signInWithPassword({ email: normalizedEmail, password })
        : await client.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: { full_name: signupName.trim() },
              emailRedirectTo: window.location.origin,
            },
          });
    setBusy(false);
    if (result.error) {
      const lower = result.error.message.toLowerCase();
      setMessage(
        lower.includes("already") || lower.includes("registered")
          ? "An account may already exist for this email. Choose Sign in instead."
          : result.error.message,
      );
      return;
    }
    if (mode === "signup") {
      const identities = result.data.user?.identities;
      if (Array.isArray(identities) && identities.length === 0) {
        setMessage("An account already exists for this email. Choose Sign in instead.");
        return;
      }
      if (!result.data.session) {
        setSignupPendingEmail(normalizedEmail);
        setMessage(`Account created. We sent a confirmation link to ${normalizedEmail}. Confirm that email, then return to Cantoa to sign in.`);
        setPassword("");
        setConfirmPassword("");
        return;
      }
      setMessage("Account created and signed in. Your private library and 2 free music creations are ready.");
      setPassword("");
      setConfirmPassword("");
      return;
    }
    setMessage("You are signed in. Your library is connected.");
    setPassword("");
  };
  const resendConfirmation = async () => {
    if (!client || !signupPendingEmail) return;
    setResendBusy(true);
    const { error } = await client.auth.resend({
      type: "signup",
      email: signupPendingEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    setResendBusy(false);
    setMessage(
      error
        ? error.message
        : `Confirmation email resent to ${signupPendingEmail}. Check spam or your organization’s email quarantine if you do not see it.`,
    );
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
              <button
                type="button"
                className="account-manage-membership"
                onClick={() => void openMembershipPortal()}
              >
                <Settings />
                <span>
                  <b>Manage Membership</b>
                  <small>Change plan, cancel, update payment method, or view invoices</small>
                </span>
              </button>
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
                onClick={() => { setMode("signin"); setMessage(""); setSignupPendingEmail(""); }}
              >
                Sign in
              </button>
              <button
                className={mode === "signup" ? "active" : ""}
                onClick={() => { setMode("signup"); setMessage(""); setSignupPendingEmail(""); }}
              >
                Create account
              </button>
            </div>
            {mode === "signup" && (
              <>
                <p className="signup-explainer">
                  Create your private Cantoa account with your name, email and a password of at least 8 characters. If email verification is enabled, you will receive a confirmation link before you can sign in.
                </p>
                <label className="auth-field">
                  <span>
                    <UserCircle /> Your name
                  </span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={signupName}
                    onChange={(event) => setSignupName(event.target.value)}
                    placeholder="Your name"
                    maxLength={80}
                  />
                </label>
              </>
            )}
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
            {mode === "signup" && (
              <label className="auth-field">
                <span>
                  <ShieldCheck /> Confirm password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  placeholder="Type the same password again"
                />
              </label>
            )}
            <button
              className="account-submit"
              disabled={
                busy ||
                !email.trim() ||
                password.length < 8 ||
                (mode === "signup" && (signupName.trim().length < 2 || confirmPassword !== password))
              }
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
            {signupPendingEmail && (
              <button
                className="resend-confirmation"
                disabled={resendBusy}
                onClick={resendConfirmation}
              >
                {resendBusy ? "Resending…" : "Resend confirmation email"}
              </button>
            )}
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
