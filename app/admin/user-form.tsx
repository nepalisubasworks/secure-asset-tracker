"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^[A-Za-z\s]+$/.test(name)) {
      setError("Name must contain letters only, no numbers.");
      return;
    }

    if (contact && !/^\d{10}$/.test(contact)) {
      setError("Contact number must be exactly 10 digits.");
      return;
    }

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, gender, address, contact }),
    });

    if (!res.ok) {
      let message = `Failed (status ${res.status}).`;
      try {
        const data = await res.json();
        message = data.error || message;
      } catch {
        // no JSON body
      }
      setError(message);
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setGender("");
    setAddress("");
    setContact("");
    setSuccess("Account created.");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="field">
          <label>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Temporary password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="field">
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="USER">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
        <div className="field">
          <label>Contact number</label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="e.g. 98XXXXXXXX"
            maxLength={10}
          />
        </div>
        <div className="field">
          <label>Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="City, area"
          />
        </div>
      </div>
      <button type="submit">Create account</button>
      {error && <p className="error-text">{error}</p>}
      {success && <p style={{ color: "var(--accent)", fontSize: 13, marginTop: 8 }}>{success}</p>}
    </form>
  );
}