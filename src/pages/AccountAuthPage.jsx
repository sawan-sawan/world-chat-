import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { KeyRound, Mail } from "lucide-react";
import { auth } from "../lib/firebase";
import favicon from "../favicon.png";
import "./AccountAuthPage.css";

function AccountAuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event) {
    event.preventDefault();
    await runAuthAction(() => signInWithEmailAndPassword(auth, email.trim(), password));
  }

  async function createAccount() {
    await runAuthAction(() => createUserWithEmailAndPassword(auth, email.trim(), password));
  }

  async function resetPassword() {
    if (!email.trim()) {
      setMessage("Password reset ke liye pehle apna email enter karein.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Password reset email bhej diya gaya hai. Apna inbox check karein.");
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function runAuthAction(action) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-auth-page">
      <section className="account-auth-card">
        <img className="account-auth-logo" src={favicon} alt="Talknesty" />
        <h1>talknesty</h1>
        <p className="account-auth-copy">
          Create an account once. Recover it anytime with your email.
        </p>

        <form className="account-auth-form" onSubmit={signIn}>
          <label>
            <span>
              <Mail size={16} />
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <span>
              <KeyRound size={16} />
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </label>

          <button className="account-auth-primary" type="submit" disabled={busy}>
            {busy ? "Please wait..." : "Sign in"}
          </button>
        </form>

        <div className="account-auth-actions">
          <button type="button" onClick={createAccount} disabled={busy}>
            Create account
          </button>
          <button type="button" onClick={resetPassword} disabled={busy}>
            Forgot password?
          </button>
        </div>

        {message ? <p className="account-auth-message">{message}</p> : null}
        <p className="free-auth-note">
          New user? Create account. Returning user? Sign in.
        </p>
      </section>
    </main>
  );
}

function getAuthErrorMessage(error) {
  switch (error?.code) {
    case "auth/email-already-in-use":
      return "Is email ka account pehle se bana hua hai. Sign in karein.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email ya password sahi nahi hai.";
    case "auth/invalid-email":
      return "Valid email enter karein.";
    case "auth/weak-password":
      return "Password kam se kam 6 characters ka rakhein.";
    case "auth/operation-not-allowed":
      return "Firebase Console mein Email/Password sign-in enable karein.";
    case "auth/too-many-requests":
      return "Kaafi attempts ho gaye. Thodi der baad dobara try karein.";
    default:
      return "Login nahi ho paya. Dobara try karein.";
  }
}

export default AccountAuthPage;
