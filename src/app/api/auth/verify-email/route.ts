import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?verified=invalid", request.url));
    }

    const verification = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      return NextResponse.redirect(new URL("/login?verified=invalid", request.url));
    }

    if (verification.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: verification.id } });
      return NextResponse.redirect(new URL("/login?verified=expired", request.url));
    }

    await prisma.user.update({
      where: { id: verification.userId },
      data: { isVerified: true },
    });

    await prisma.verificationToken.deleteMany({
      where: { userId: verification.userId },
    });

    return NextResponse.redirect(new URL("/login?verified=1", request.url));
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.redirect(new URL("/login?verified=error", request.url));
  }
}
