import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const result = await requireRole("ADMIN");
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  const body = await req.json();
if (!body.name || !body.email || !body.password) {
  return NextResponse.json(
    { error: "name, email, and password are required." },
    { status: 400 }
  );
}

if (body.password.length < 6) {
  return NextResponse.json(
    { error: "Password must be at least 6 characters." },
    { status: 400 }
  );
}

// Name: letters and spaces only, no digits
if (!/^[A-Za-z\s]+$/.test(body.name)) {
  return NextResponse.json(
    { error: "Name must contain letters only, no numbers." },
    { status: 400 }
  );
}

// Contact: optional, but if provided must be exactly 10 digits
if (body.contact && !/^\d{10}$/.test(body.contact)) {
  return NextResponse.json(
    { error: "Contact number must be exactly 10 digits." },
    { status: 400 }
  );
}

try {
  const hashedPassword = await bcrypt.hash(body.password, 10);

  const userCount = await prisma.user.count();
  const employeeId = `EMP-${String(userCount + 1).padStart(4, "0")}`;

  const user = await prisma.user.create({
    data: {
      employeeId,
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role === "ADMIN" ? "ADMIN" : "USER",
      gender: body.gender || null,
      address: body.address || null,
      contact: body.contact || null,
    },
    select: { id: true, employeeId: true, name: true, email: true, role: true },
  });
    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
