import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, isAdmin } from "@/lib/auth-helpers";

// GET /api/assets — list assets (admins see all, users see only their own)
export async function GET() {
  const result = await requireAuth();
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const assets = isAdmin(result.user)
    ? await prisma.asset.findMany({ include: { owner: { select: { name: true, email: true } } } })
    : await prisma.asset.findMany({ where: { ownerId: result.user.id } });

  return NextResponse.json(assets);
}

// POST /api/assets — create a new asset (ADMIN ONLY — assets start unassigned)
export async function POST(req: NextRequest) {
  const result = await requireRole("ADMIN");
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const body = await req.json();

  if (!body.assetName || !body.serialNumber) {
    return NextResponse.json(
      { error: "assetName and serialNumber are required." },
      { status: 400 }
    );
  }

  try {
    const asset = await prisma.asset.create({
      data: {
        assetName: body.assetName,
        serialNumber: body.serialNumber,
        status: "IN_STORAGE",
        // no ownerId — new assets start unassigned, admin assigns them later
      },
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "An asset with this serial number already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create asset." }, { status: 500 });
  }
}