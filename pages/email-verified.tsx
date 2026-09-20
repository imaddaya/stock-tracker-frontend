import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { apiRequest } from "../utils/api";

export default function EmailVerified() {
  const router = useRouter();
  const { token } = router.query;

  const [verificationToken, setVerificationToken] = useState("");
  const [status, setStatus] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [wasVerified, setWasVerified] = useState(false);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const tokenStr = Array.isArray(token) ? token[0] : token;

    if (!tokenStr) {
      setHasError(true);
      setStatus(
        "Missing verification token. Please use the link from your email.",
      );
      return;
    }

    setVerificationToken(tokenStr);
    setHasError(false);
    setStatus("");
  }, [router.isReady, token]);

  const handleVerifyEmail = async () => {
    if (!verificationToken || isVerifying || wasVerified) {
      return;
    }

    setIsVerifying(true);
    setHasError(false);
    setStatus("Verifying your email...");

    try {
      await apiRequest(
        `/auth/verify-email?token=${encodeURIComponent(verificationToken)}`,
        {
          method: "POST",
        },
      );

      setWasVerified(true);
      setStatus("Email verified successfully. Redirecting to login...");

      setTimeout(() => {
        void router.push("/");
      }, 3000);
    } catch (error) {
      console.error("Email verification failed:", error);

      setHasError(true);
      setStatus(
        error instanceof Error
          ? `Email verification failed: ${error.message}`
          : "Email verification failed.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        fontFamily: "'Poppins', sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          color: hasError ? "#dc3545" : wasVerified ? "#28a745" : "#212529",
          marginBottom: "1rem",
        }}
      >
        Email Verification
      </h2>

      {!wasVerified && verificationToken && (
        <>
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: "1.5",
            }}
          >
            Click the button below to verify your email address.
          </p>

          <button
            type="button"
            onClick={() => void handleVerifyEmail()}
            disabled={isVerifying}
            style={{
              marginTop: "1rem",
              padding: "0.65rem 1.2rem",
              backgroundColor: isVerifying ? "#adb5bd" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isVerifying ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {isVerifying ? "Verifying..." : "Verify Email"}
          </button>
        </>
      )}

      {status && (
        <p
          style={{
            fontSize: "1.1rem",
            lineHeight: "1.5",
            marginTop: "1.5rem",
            color: hasError ? "#dc3545" : wasVerified ? "#28a745" : "#6c757d",
          }}
        >
          {status}
        </p>
      )}

      {hasError && (
        <button
          type="button"
          onClick={() => void router.push("/")}
          style={{
            marginTop: "1.5rem",
            padding: "0.6rem 1.2rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Return to Login
        </button>
      )}
    </div>
  );
}
