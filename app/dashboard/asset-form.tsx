"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssetForm() {
  const [assetName, setAssetName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetName, serialNumber }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      return;
    }

    setAssetName("");
    setSerialNumber("");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="field">
          <label>Asset name</label>
          <input
            placeholder="e.g. Dell Latitude 5420"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Serial number</label>
          <input
            placeholder="e.g. SN-4821"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            required
          />
        </div>
      </div>
      <button type="submit">Add asset</button>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}