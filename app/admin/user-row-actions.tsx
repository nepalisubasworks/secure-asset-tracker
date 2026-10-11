"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@/lib/graphql-client";

export function UserRowActions({
  id,
  name,
  email,
  role,
}: {
  id: string;
  name: string;
  email: string;
  role: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name ?? "");
  const [editEmail, setEditEmail] = useState(email ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return;
    const clearOnClick = () => setError("");
    const timer = setTimeout(() => {
      document.addEventListener("click", clearOnClick, { once: true });
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", clearOnClick);
    };
  }, [error]);

  const patch = async (body: object) => {
    try {
      await gql(
        `mutation($id: ID!, $input: UpdateUserInput!) {
          updateUser(id: $id, input: $input) { id }
        }`,
        { id, input: body }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      return false;
    }
    router.refresh();
    return true;
  };

  const handleRoleChange = async (newRole: string) => {
    await patch({ role: newRole });
  };

  const handleSaveEdit = async () => {
    setError("");
    const ok = await patch({ name: editName, email: editEmail });
    if (ok) setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    setError("");
    try {
      await gql(`mutation($id: ID!) { deleteUser(id: $id) }`, { id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      return;
    }
    router.refresh();
  };

  if (editing) {
    return (
      <div className="asset-actions">
        <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: 140 }} />
        <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ width: 180 }} />
        <button onClick={handleSaveEdit}>Save</button>
        <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
        {error && <span className="error-text">{error}</span>}
      </div>
    );
  }

  return (
    <div className="asset-actions">
      <select value={role} onChange={(e) => handleRoleChange(e.target.value)}>
        <option value="USER">USER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <button className="btn-ghost" onClick={() => setEditing(true)}>Edit</button>
      <button className="btn-danger" onClick={handleDelete}>Delete</button>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}