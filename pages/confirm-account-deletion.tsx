import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

import { apiRequest } from "../utils/api";

export default function ConfirmAccountDeletion() {
  const router = useRouter();
  const { token } = router.query;

  const requestStarted = useRef(false);

  const [status, setStatus] = useState("Processing account deletion...");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!router.isReady || !token || requestStarted.current) {
      return;
    }

    const tokenStr = Array.isArray(token) ? token[0] : token;

    if (!tokenStr) {
      setHasError(true);
      setStatus("Invalid account deletion link.");
      return;
    }

    requestStarted.current = true;

    const confirmDeletion = async () => {
      try {
        await apiRequest(
          `/user/confirm-delete-account?token=${encodeURIComponent(tokenStr)}`,
          {
            method: "POST",
          },
        );

        localStorage.removeItem("access_token");
        localStorage.removeItem("user_email");

        setHasError(false);
        setStatus(
          "Account deleted successfully. You will be redirected to the homepage...",
        );

        setTimeout(() => {
          void router.push("/");
        }, 3000);
      } catch (error) {
        console.error("Account deletion confirmation failed:", error);

        setHasError(true);
        setStatus(
          error instanceof Error
            ? `Error deleting account: ${error.message}`
            : "Error deleting account.",
        );
      }
    };

    void confirmDeletion();
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
          color: hasError
            ? "#dc3545"
            : status.includes("successfully")
              ? "#28a745"
              : "#6c757d",
          marginBottom: "1rem",
        }}
      >
        Account Deletion Confirmation
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
        <div style={{ marginTop: "2rem" }}>
          <button
            type="button"
            onClick={() => void router.push("/")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Return to Homepage
          </button>
        </div>
      )}
    </div>
  );
}
