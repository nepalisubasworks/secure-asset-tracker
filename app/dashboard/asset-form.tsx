"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@/lib/graphql-client";

export function AssetForm() {
  const [assetName, setAssetName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await gql(
        `mutation($assetName: String!, $serialNumber: String!) {
          createAsset(assetName: $assetName, serialNumber: $serialNumber) { id }
        }`,
        { assetName, serialNumber }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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