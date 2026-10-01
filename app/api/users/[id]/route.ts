import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireRole("ADMIN");
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const { id } = await params;
  const body = await req.json();

  const data: { name?: string; email?: string; role?: string } = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.role !== undefined) data.role = body.role === "ADMIN" ? "ADMIN" : "USER";

  if (body.role !== undefined && data.role === "USER") {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.role === "ADMIN") {
      if (id === result.user.id) {
        return NextResponse.json(
          { error: "You cannot demote your own account." },
          { status: 400 }
        );
      }
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last remaining admin account." },
          { status: 400 }
        );
      }
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireRole("ADMIN");
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (id === result.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  if (user.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last remaining admin account." },
        { status: 400 }
      );
    }
  }

  await prisma.asset.updateMany({
    where: { ownerId: id },
    data: { ownerId: null, status: "IN_STORAGE" },
  });

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
