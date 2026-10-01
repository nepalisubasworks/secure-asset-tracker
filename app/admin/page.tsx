import { UserForm } from "./user-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "../dashboard/sign-out-button";
import { UserRowActions } from "./user-row-actions";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

 const users = await prisma.user.findMany({
  select: { id: true, employeeId: true, name: true, email: true, role: true },
});

  return (
    <div className="page">
      <div className="topbar">
        <div className="brand">
          Asset<span className="accent-dot">Tracker</span> — Admin
        </div>
        <div className="identity">
          <a href="/dashboard">Dashboard</a>
          <span><strong>{session.user.name}</strong> — {session.user.role}</span>
          <SignOutButton />
        </div>
      </div>

      <div className="card">
        <h2>Create Employee Account</h2>
        <UserForm />
      </div>

      <div className="card">
        <h2>All Users</h2>
        <ul className="asset-list">
          {users.map((u) => (
           <li key={u.id} className="asset-row">
  <div className="asset-main">
    <span className="tag">{u.employeeId}</span>
    <span className="asset-name">{u.name}</span>
    <span className="owner">{u.email}</span>
  </div>
  <UserRowActions id={u.id} name={u.name} email={u.email} role={u.role} />
</li>
          ))}
        </ul>
      </div>
    </div>
  );
}