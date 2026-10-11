"use client";

import { useState } from "react";
import { gql } from "@/lib/graphql-client";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await gql(
        `mutation($currentPassword: String!, $newPassword: String!) {
          changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
        }`,
        { currentPassword, newPassword }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return;
    }

    setMessage("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="field">
          <label>Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
      </div>
      <button type="submit">Update password</button>
      {message && <p style={{ color: "var(--accent)", fontSize: 13, marginTop: 8 }}>{message}</p>}
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}