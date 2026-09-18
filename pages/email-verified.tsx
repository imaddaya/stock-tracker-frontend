import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

import { apiRequest } from "../utils/api";

export default function EmailVerified() {
  const router = useRouter();
  const { token } = router.query;

  const requestStarted = useRef(false);

  const [status, setStatus] = useState("Verifying your email...");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!router.isReady || requestStarted.current) {
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

    requestStarted.current = true;

    const verifyEmail = async () => {
      try {
        await apiRequest(
          `/auth/verify-email?token=${encodeURIComponent(tokenStr)}`,
        );

        setHasError(false);
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
      }
    };

    void verifyEmail();
  }, [router, token]);

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
          color: hasError ? "#dc3545" : "#28a745",
          marginBottom: "1rem",
        }}
      >
        Email Verification
      </h2>

      <p
        style={{
          fontSize: "1.1rem",
          lineHeight: "1.5",
        }}
      >
        {status}
      </p>

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
