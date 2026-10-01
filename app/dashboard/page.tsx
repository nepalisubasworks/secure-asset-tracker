import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import { SignOutButton } from "./sign-out-button";
import { AssetForm } from "./asset-form";
import { AssetActions } from "./asset-actions";
import { PasswordForm } from "./password-form";

const STATUS_CLASS: Record<string, string> = {
  IN_STORAGE: "storage",
  ASSIGNED: "assigned",
  RETIRED: "retired",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const admin = isAdmin(session.user);

  const assets = await prisma.asset.findMany({
    where: admin ? undefined : { ownerId: session.user.id },
    include: { owner: { select: { name: true, email: true } } },
  });

  const users = admin
    ? await prisma.user.findMany({ select: { id: true, name: true, email: true } })
    : [];

  return (
    <div className="page">
 <div className="topbar">
  <div className="brand">
    Asset<span className="accent-dot">Tracker</span>
  </div>
  <div className="identity">
    {admin && <a href="/admin">Admin Panel</a>}
<span><strong>{session.user.name}</strong> · {session.user.employeeId} — {session.user.role === "ADMIN" ? "Admin" : "Employee"}</span>
    <SignOutButton />
  </div>
</div>
<div className="card">
  <h2>Change Password</h2>
  <PasswordForm />
</div>

      {admin ? (
        <div className="card">
          <h2>Register New Asset</h2>
          <AssetForm />
        </div>
      ) : null}

      <div className="card">
        <h2>{admin ? "All Assets" : "My Assets"}</h2>

        {assets.length === 0 ? (
          <p className="empty-state">
            {admin ? "No assets registered yet." : "No equipment assigned to you yet."}
          </p>
        ) : (
          <ul className="asset-list">
            {assets.map((asset) => (
              <li key={asset.id} className="asset-row">
                <div className="asset-main">
                  <span className="asset-name">{asset.assetName}</span>
                  <span className="tag">{asset.serialNumber}</span>
                  <span className="status-pill">
                    <span className={`status-dot ${STATUS_CLASS[asset.status]}`} />
                    {asset.status}
                  </span>
                  {admin && (
                    <span className="owner">
                      {asset.owner ? asset.owner.name : "Unassigned"}
                    </span>
                  )}
                </div>
                {admin && (
<AssetActions
  id={asset.id}
  status={asset.status}
  ownerId={asset.ownerId}
  assetName={asset.assetName}
  serialNumber={asset.serialNumber}
  users={users}
/>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}