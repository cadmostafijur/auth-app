import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import SignOutButton from "@/components/SignOutButton";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      email: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user || !user.isVerified) {
    redirect("/login");
  }

  return (
    <div className="dashboard-shell">
      <section className="dashboard-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-600">Authenticated and verified user area.</p>
          </div>
          <SignOutButton />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
            <p className="mt-1 font-medium text-slate-900">{user.email}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Verified</p>
            <p className="mt-1 font-medium text-green-700">Yes</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Account created on {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(user.createdAt)}
        </p>
      </section>
    </div>
  );
}
