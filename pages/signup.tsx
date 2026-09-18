import { useState } from "react";
import Link from "next/link";

import { apiRequest } from "../utils/api";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [alphaKey, setAlphaKey] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleSignup = async () => {
    if (loading || isWaiting) {
      return;
    }

    setStatus("");

    if (!email.trim()) {
      setStatus("Please enter your email.");
      return;
    }

    if (!isPasswordValid) {
      setStatus("Please make sure your password meets all requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    if (!alphaKey.trim()) {
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

      setStatus(
        "Account created. Please check your email to verify your account.",
      );
      setIsWaiting(true);
    } catch (error) {
      console.error("Signup error:", error);

      setStatus(
        error instanceof Error
          ? error.message
          : "Signup failed. Please try again.",
      );
    } finally {
      setLoading(false);
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
        disabled={loading || isWaiting}
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
        disabled={loading || isWaiting}
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
        disabled={loading || isWaiting}
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
        disabled={loading || isWaiting}
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
        disabled={loading || isWaiting || !isFormValid}
        style={{
          padding: "0.7rem 2rem",
          cursor:
            loading || isWaiting || !isFormValid ? "not-allowed" : "pointer",
        }}
      >
        {loading
          ? "Creating account..."
          : isWaiting
            ? "Verification email sent"
            : "Create Account"}
      </button>

      <div style={{ marginTop: "1.5rem" }}>
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
            color: isWaiting ? "green" : "red",
          }}
        >
          {status}
        </p>
      )}
    </div>
  );
}
