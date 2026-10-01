import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const result = await requireAuth();
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const body = await req.json();
if (!body.currentPassword || !body.newPassword) {
  return NextResponse.json(
    { error: "currentPassword and newPassword are required." },
    { status: 400 }
  );
}

if (body.newPassword.length < 6) {
  return NextResponse.json(
    { error: "New password must be at least 6 characters." },
    { status: 400 }
  );
}

  const user = await prisma.user.findUnique({ where: { id: result.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const matches = await bcrypt.compare(body.currentPassword, user.password);
  if (!matches) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  const newHash = await bcrypt.hash(body.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: newHash },
  });

  return NextResponse.json({ success: true });
}