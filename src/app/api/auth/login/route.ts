import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { AUTH_COOKIE_NAME, authCookieOptions, createAuthToken } from "@/lib/auth";
import { ensureAuthSchema } from "@/lib/db-init";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    await ensureAuthSchema(prisma);
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { message: "Please verify your email before logging in." },
        { status: 403 },
      );
    }

    const authToken = createAuthToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json({ message: "Login successful" });
    response.cookies.set(AUTH_COOKIE_NAME, authToken, authCookieOptions);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Unable to login" }, { status: 500 });
  }
}
