import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { apiRequest } from "../utils/api";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [wasSuccessful, setWasSuccessful] = useState(false);

  const validation = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecial: /[!@#$%^&*]/.test(newPassword),
  };

  const isPasswordValid = Object.values(validation).every(Boolean);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!token) {
      setStatus("Missing reset token. Please use the link from your email.");
    }
  }, [token, router.isReady]);

  const handleSubmit = async () => {
    const tokenStr = Array.isArray(token) ? token[0] : token;

    if (!tokenStr) {
      setStatus("Password reset token is missing.");
      return;
    }

    if (!isPasswordValid) {
      setStatus("Please make sure your password meets all requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setWasSuccessful(false);
    setStatus("");

    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: tokenStr,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      setWasSuccessful(true);
      setStatus("Password reset successfully. You may now log in.");

      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        void router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Password reset failed:", error);

      setStatus(
        error instanceof Error
          ? error.message
          : "Password reset failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const tokenAvailable =
    typeof token === "string" || (Array.isArray(token) && Boolean(token[0]));

  const isReadyToSubmit =
    tokenAvailable &&
    isPasswordValid &&
    newPassword === confirmPassword &&
    !isLoading;

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      <h2>Reset Your Password</h2>

      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        disabled={isLoading || wasSuccessful}
        style={{
          margin: "1rem",
          padding: "0.5rem",
          width: "300px",
        }}
      />

      <br />

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

      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        disabled={isLoading || wasSuccessful}
        style={{
          margin: "1rem",
          padding: "0.5rem",
          width: "300px",
        }}
      />

      <br />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isReadyToSubmit}
        style={{
          padding: "0.7rem 2rem",
          cursor: isReadyToSubmit ? "pointer" : "not-allowed",
        }}
      >
        {isLoading ? "Submitting..." : "Reset Password"}
      </button>

      {status && (
        <p
          style={{
            color: wasSuccessful ? "green" : "red",
            marginTop: "1rem",
          }}
        >
          {status}
        </p>
      )}
    </div>
  );
}
