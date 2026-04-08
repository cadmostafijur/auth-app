import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureAuthSchema } from "@/lib/db-init";
import { sendVerificationEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

const signUpSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const appUrl = new URL(request.url).origin;
    await ensureAuthSchema(prisma);
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.isVerified) {
        return NextResponse.json(
          { message: "Account already exists. Please log in." },
          { status: 409 },
        );
      }

      await prisma.verificationToken.deleteMany({ where: { userId: existing.id } });

      const retryToken = crypto.randomUUID();
      const retryExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

      await prisma.verificationToken.create({
        data: {
          token: retryToken,
          userId: existing.id,
          expiresAt: retryExpiresAt,
        },
      });

      try {
        await sendVerificationEmail(email, retryToken, { appUrl });
      } catch (mailError) {
        console.error("Signup resend mail error:", mailError);
        return NextResponse.json(
          { message: "Unable to send verification email. Please try again." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        message: "Account exists but is not verified. We sent a new verification email.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    try {
      await sendVerificationEmail(email, token, { appUrl });
    } catch (mailError) {
      await prisma.verificationToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      console.error("Signup mail error:", mailError);
      return NextResponse.json(
        { message: "Unable to send verification email. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Account created. Check your email to verify your account.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Unable to create account" },
      { status: 500 },
    );
  }
}
