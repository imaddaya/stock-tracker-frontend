import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { apiRequest } from "../utils/api";

export default function ConfirmAccountDeletion() {
  const router = useRouter();
  const { token } = router.query;

  const [deletionToken, setDeletionToken] = useState("");
  const [status, setStatus] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wasDeleted, setWasDeleted] = useState(false);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const tokenStr = Array.isArray(token) ? token[0] : token;

    if (!tokenStr) {
      setHasError(true);
      setStatus(
        "Invalid or missing account deletion token. Please use the link from your email.",
      );
      return;
    }

    setDeletionToken(tokenStr);
    setHasError(false);
    setStatus("");
  }, [router.isReady, token]);

  const handleDeleteAccount = async () => {
    if (!deletionToken || isDeleting || wasDeleted) {
      return;
    }

    setIsDeleting(true);
    setHasError(false);
    setStatus("Deleting your account...");

    try {
      await apiRequest(
        `/user/confirm-delete-account?token=${encodeURIComponent(deletionToken)}`,
        {
          method: "POST",
        },
      );

      localStorage.removeItem("access_token");
      localStorage.removeItem("user_email");
      localStorage.removeItem("portfolioEntries");

      setWasDeleted(true);
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
    } finally {
      setIsDeleting(false);
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
          color: hasError ? "#dc3545" : wasDeleted ? "#28a745" : "#212529",
          marginBottom: "1rem",
        }}
      >
        Account Deletion Confirmation
      </h2>

      {!wasDeleted && deletionToken && (
        <>
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: "1.5",
            }}
          >
            This action permanently deletes your account and cannot be undone.
          </p>

          <p
            style={{
              fontSize: "1rem",
              lineHeight: "1.5",
              color: "#6c757d",
              marginBottom: "1.5rem",
            }}
          >
            Your account will only be deleted after you press the confirmation
            button below.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => void handleDeleteAccount()}
              disabled={isDeleting}
              style={{
                padding: "0.65rem 1.1rem",
                backgroundColor: isDeleting ? "#adb5bd" : "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isDeleting ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete My Account"}
            </button>

            <button
              type="button"
              onClick={() => void router.push("/")}
              disabled={isDeleting}
              style={{
                padding: "0.65rem 1.1rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isDeleting ? "not-allowed" : "pointer",
                fontSize: "1rem",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {status && (
        <p
          style={{
            fontSize: "1.1rem",
            lineHeight: "1.5",
            marginTop: "1.5rem",
            color: hasError ? "#dc3545" : wasDeleted ? "#28a745" : "#6c757d",
          }}
        >
          {status}
        </p>
      )}

      {hasError && (
        <div style={{ marginTop: "1.5rem" }}>
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
