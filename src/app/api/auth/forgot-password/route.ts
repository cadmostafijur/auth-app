import { NextResponse } from "next/server";
import { z } from "zod";

import { sendPasswordResetEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

const forgotPasswordSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

const genericMessage = "If an account exists, a password reset link has been sent.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: genericMessage });
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: genericMessage });
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: genericMessage });
  }
}
