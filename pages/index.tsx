import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import { apiRequest } from "../utils/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleLogin = async () => {
    if (!isFormValid || loading) {
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!data?.access_token) {
        throw new Error("The server did not return an access token.");
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_email", email.trim());

      await router.push("/loggedin");
    } catch (error) {
      console.error("Login error:", error);

      setStatus(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setStatus("Please enter your email first.");
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: trimmedEmail,
        }),
      });

      setStatus(
        "If the account is eligible, password reset instructions have been sent.",
      );
    } catch (error) {
      console.error("Forgot password error:", error);

      // Keep the response generic so the UI does not
      // reveal whether an account exists.
      setStatus(
        "If the account is eligible, password reset instructions have been sent.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url(stocksphoto.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <h1
        style={{
          color: "#89CFF0",
          fontWeight: "bold",
          fontSize: "4rem",
          marginBottom: "3rem",
          textAlign: "center",
        }}
      >
        Stokki
      </h1>

      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          borderRadius: "20px",
          padding: "2rem 3rem",
          minWidth: "320px",
          maxWidth: "400px",
          boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "1.5rem" }}>LOGIN</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "0.8rem",
            marginBottom: "1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "1rem",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          disabled={loading}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isFormValid && !loading) {
              void handleLogin();
            }
          }}
          style={{
            width: "100%",
            padding: "0.8rem",
            marginBottom: "0.5rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "1rem",
          }}
        />

        <div
          style={{
            textAlign: "right",
            marginBottom: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={loading}
            style={{
              padding: 0,
              border: "none",
              background: "none",
              fontSize: "0.9rem",
              color: "#0070f3",
              textDecoration: "underline",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="button"
          disabled={!isFormValid || loading}
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "0.9rem",
            backgroundColor: isFormValid && !loading ? "#89CFF0" : "#aaccee",
            border: "none",
            borderRadius: "10px",
            color: "white",
            fontWeight: "bold",
            fontSize: "1.1rem",
            cursor: isFormValid && !loading ? "pointer" : "not-allowed",
            marginBottom: "1.5rem",
          }}
        >
          {loading ? "Please wait..." : "Login"}
        </button>

        <div>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{
              color: "#0070f3",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Signup here
          </Link>
        </div>

        {status && (
          <p
            style={{
              color: "red",
              marginTop: "1rem",
            }}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
