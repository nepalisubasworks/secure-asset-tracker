import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canAccessResource, isAdmin } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAuth();
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const { id } = await params;
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const body = await req.json();

  // Editing name/serial and reassigning ownership are admin-only
  if ((body.assetName !== undefined || body.serialNumber !== undefined || body.ownerId !== undefined) && !isAdmin(result.user)) {
    return NextResponse.json({ error: "Only admins can edit assets." }, { status: 403 });
  }

  if (body.status !== undefined) {
    const allowed = isAdmin(result.user) || (asset.ownerId && canAccessResource(result.user, asset.ownerId));
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const data: { status?: string; ownerId?: string | null; assetName?: string; serialNumber?: string } = {};

  if (body.assetName !== undefined) data.assetName = body.assetName;
  if (body.serialNumber !== undefined) data.serialNumber = body.serialNumber;

  if (body.ownerId !== undefined) {
    data.ownerId = body.ownerId || null;
    data.status = body.ownerId ? "ASSIGNED" : "IN_STORAGE";
  }

  if (body.status !== undefined) {
    const effectiveOwnerId = body.ownerId !== undefined ? body.ownerId : asset.ownerId;
    if (body.status === "ASSIGNED" && !effectiveOwnerId) {
      return NextResponse.json(
        { error: "Cannot mark an asset ASSIGNED without an owner. Assign it to someone first." },
        { status: 400 }
      );
    }
    data.status = body.status;
    if (body.status === "IN_STORAGE" || body.status === "RETIRED") {
      data.ownerId = null;
    }
  }

  try {
    const updated = await prisma.asset.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "An asset with this serial number already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update asset." }, { status: 500 });
  }
}