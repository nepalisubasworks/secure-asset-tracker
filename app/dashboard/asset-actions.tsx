"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["IN_STORAGE", "ASSIGNED", "RETIRED"];

type UserOption = { id: string; name: string; email: string };

export function AssetActions({
  id,
  status,
  ownerId,
  assetName,
  serialNumber,
  users,
}: {
  id: string;
  status: string;
  ownerId: string | null;
  assetName: string;
  serialNumber: string;
  users: UserOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
const [name, setName] = useState(assetName ?? "");
const [serial, setSerial] = useState(serialNumber ?? "");
  const [error, setError] = useState("");

  const patch = async (body: object) => {
    const res = await fetch(`/api/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed.");
      return false;
    }
    router.refresh();
    return true;
  };

  const handleSaveEdit = async () => {
    setError("");
    const ok = await patch({ assetName: name, serialNumber: serial });
    if (ok) setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this asset?")) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    router.refresh();
  };

  if (editing) {
    return (
      <div className="asset-actions">
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: 140 }} />
        <input value={serial} onChange={(e) => setSerial(e.target.value)} style={{ width: 100 }} />
        <button onClick={handleSaveEdit}>Save</button>
        <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
        {error && <span className="error-text">{error}</span>}
      </div>
    );
  }

  return (
    <div className="asset-actions">
      <select value={ownerId ?? ""} onChange={(e) => patch({ ownerId: e.target.value })}>
        <option value="">Unassigned</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
      <select value={status} onChange={(e) => patch({ status: e.target.value })}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <button className="btn-ghost" onClick={() => setEditing(true)}>Edit</button>
      <button className="btn-danger" onClick={handleDelete}>Delete</button>
    </div>
  );
}