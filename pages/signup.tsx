import { useState } from "react";
import Link from "next/link";

import { apiRequest } from "../utils/api";

type StatusKind = "success" | "error";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [alphaKey, setAlphaKey] = useState("");

  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<StatusKind>("error");

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [isWaiting, setIsWaiting] = useState(false);

  const validation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password),
  };

  const isPasswordValid = Object.values(validation).every(Boolean);

  const isFormValid =
    email.trim() !== "" &&
    password !== "" &&
    confirmPassword !== "" &&
    alphaKey.trim() !== "" &&
    password === confirmPassword &&
    isPasswordValid;

  const canResend =
    email.trim() !== "" && password !== "" && !loading && !resendLoading;

  const handleSignup = async () => {
    if (loading || resendLoading || isWaiting) {
      return;
    }

    setStatus("");

    if (!email.trim()) {
      setStatusKind("error");
      setStatus("Please enter your email.");
      return;
    }

    if (!isPasswordValid) {
      setStatusKind("error");
      setStatus("Please make sure your password meets all requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setStatusKind("error");
      setStatus("Passwords do not match.");
      return;
    }

    if (!alphaKey.trim()) {
      setStatusKind("error");
      setStatus("Please enter your Alpha Vantage API key.");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
          alpha_vantage_api_key: alphaKey.trim(),
        }),
      });

      setStatusKind("success");
      setStatus(
        "Account created. Please check your email to verify your account.",
      );

      setIsWaiting(true);
    } catch (error) {
      console.error("Signup error:", error);

      setStatusKind("error");
      setStatus(
        error instanceof Error
          ? error.message
          : "Signup failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!canResend) {
      return;
    }

    if (!email.trim()) {
      setStatusKind("error");
      setStatus("Please enter your email.");
      return;
    }

    if (!password) {
      setStatusKind("error");
      setStatus("Please enter your password.");
      return;
    }

    setResendLoading(true);
    setStatus("");

    try {
      const result = await apiRequest("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      setStatusKind("success");

      setStatus(
        result?.message ||
          "If the account is eligible, a new verification email will be sent.",
      );
    } catch (error) {
      console.error("Resend verification error:", error);

      setStatusKind("error");

      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to request another verification email.",
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      <h2>Signup</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        style={{
          margin: "1rem",
          padding: "0.5rem",
          width: "300px",
        }}
        disabled={loading || resendLoading || isWaiting}
      />

      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        style={{
          margin: "1rem",
          padding: "0.5rem",
          width: "300px",
        }}
        disabled={loading || resendLoading || isWaiting}
      />

      <ul
        style={{
          fontSize: "0.8rem",
          textAlign: "left",
          maxWidth: "300px",
          margin: "0 auto",
          paddingLeft: "1.2rem",
          listStyleType: "none",
        }}
      >
        <li
          style={{
            color: validation.minLength ? "#28a745" : "#dc3545",
            marginBottom: "0.2rem",
          }}
        >
          {validation.minLength ? "✓" : "✗"} At least 8 characters
        </li>

        <li
          style={{
            color: validation.hasUppercase ? "#28a745" : "#dc3545",
            marginBottom: "0.2rem",
          }}
        >
          {validation.hasUppercase ? "✓" : "✗"} At least one uppercase letter
        </li>

        <li
          style={{
            color: validation.hasLowercase ? "#28a745" : "#dc3545",
            marginBottom: "0.2rem",
          }}
        >
          {validation.hasLowercase ? "✓" : "✗"} At least one lowercase letter
        </li>

        <li
          style={{
            color: validation.hasNumber ? "#28a745" : "#dc3545",
            marginBottom: "0.2rem",
          }}
        >
          {validation.hasNumber ? "✓" : "✗"} At least one number
        </li>

        <li
          style={{
            color: validation.hasSpecial ? "#28a745" : "#dc3545",
            marginBottom: "0.2rem",
          }}
        >
          {validation.hasSpecial ? "✓" : "✗"} At least one special character
          (!@#$%^&*)
        </li>
      </ul>

      <br />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        style={{
          margin: "1rem",
          padding: "0.5rem",
          width: "300px",
        }}
        disabled={loading || resendLoading || isWaiting}
      />

      <br />

      <label>
        Alpha Vantage API Key:{" "}
        <a
          href="https://www.alphavantage.co/support/#api-key"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#0070f3",
            textDecoration: "underline",
          }}
        >
          Get your API key here
        </a>
      </label>

      <br />

      <input
        type="password"
        name="alpha_vantage_api_key"
        placeholder="Paste your Alpha Vantage API key here"
        value={alphaKey}
        onChange={(e) => setAlphaKey(e.target.value)}
        autoComplete="off"
        style={{
          margin: "1rem",
          padding: "0.5rem",
          width: "300px",
        }}
        disabled={loading || resendLoading || isWaiting}
      />

      <p
        style={{
          fontSize: "0.8rem",
          color: "gray",
        }}
      >
        Your API key is required for stock market data requests.
      </p>

      <br />

      <button
        type="button"
        onClick={handleSignup}
        disabled={loading || resendLoading || isWaiting || !isFormValid}
        style={{
          padding: "0.7rem 2rem",
          cursor:
            loading || resendLoading || isWaiting || !isFormValid
              ? "not-allowed"
              : "pointer",
        }}
      >
        {loading
          ? "Creating account..."
          : isWaiting
            ? "Verification email sent"
            : "Create Account"}
      </button>

      <div
        style={{
          marginTop: "1rem",
        }}
      >
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={!canResend}
          style={{
            padding: "0.6rem 1.2rem",
            cursor: canResend ? "pointer" : "not-allowed",
          }}
        >
          {resendLoading ? "Sending..." : "Resend Verification Email"}
        </button>
      </div>

      <p
        style={{
          fontSize: "0.8rem",
          color: "gray",
          maxWidth: "360px",
          margin: "0.75rem auto 0",
        }}
      >
        If you already created an account but never received the verification
        email, enter that account&apos;s email and password above and use the
        resend button.
      </p>

      <div
        style={{
          marginTop: "1.5rem",
        }}
      >
        Already have an account?{" "}
        <Link
          href="/"
          style={{
            color: "#0070f3",
            textDecoration: "underline",
          }}
        >
          Login here
        </Link>
      </div>

      {status && (
        <p
          style={{
            marginTop: "1rem",
            color: statusKind === "success" ? "green" : "red",
          }}
        >
          {status}
        </p>
      )}
    </div>
  );
}
