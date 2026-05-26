"use server";

import { auth } from "@/auth";
import { buildHeaders } from "@/app/lib/client_headers";
import type { AdminUser, AdminSangaku, AdminShrine, AdminStats } from "@/app/lib/definitions";

const apiUrl = process.env.API_URL!;

export async function fetchAdminStats(): Promise<AdminStats | null> {
  const session = await auth();
  try {
    const res = await fetch(`${apiUrl}/api/v1/admin/stats`, {
      headers: buildHeaders(session?.accessToken),
    });
    if (res.status === 200) {
      const data = await res.json();
      return data.data as AdminStats;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchAdminUsers(
  page?: number,
  query?: string,
): Promise<{ users: AdminUser[]; totalPages: number }> {
  const session = await auth();
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.set("page", String(page));
    if (query) params.set("query", query);
    const res = await fetch(`${apiUrl}/api/v1/admin/users?${params}`, {
      headers: buildHeaders(session?.accessToken),
    });
    if (res.status === 200) {
      const data = await res.json();
      const totalPages = Number(res.headers.get("total-pages") ?? 1);
      return { users: data.data as AdminUser[], totalPages };
    }
    return { users: [], totalPages: 1 };
  } catch {
    return { users: [], totalPages: 1 };
  }
}

export async function fetchAdminUser(id: string): Promise<AdminUser | null> {
  const session = await auth();
  try {
    const res = await fetch(`${apiUrl}/api/v1/admin/users/${id}`, {
      headers: buildHeaders(session?.accessToken),
    });
    if (res.status === 200) {
      const data = await res.json();
      return data.data as AdminUser;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchAdminSangakus(
  page?: number,
  query?: string,
): Promise<{ sangakus: AdminSangaku[]; totalPages: number }> {
  const session = await auth();
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.set("page", String(page));
    if (query) params.set("query", query);
    const res = await fetch(`${apiUrl}/api/v1/admin/sangakus?${params}`, {
      headers: buildHeaders(session?.accessToken),
    });
    if (res.status === 200) {
      const data = await res.json();
      const totalPages = Number(res.headers.get("total-pages") ?? 1);
      return { sangakus: data.data as AdminSangaku[], totalPages };
    }
    return { sangakus: [], totalPages: 1 };
  } catch {
    return { sangakus: [], totalPages: 1 };
  }
}

export async function fetchAdminSangaku(id: string): Promise<AdminSangaku | null> {
  const session = await auth();
  try {
    const res = await fetch(`${apiUrl}/api/v1/admin/sangakus/${id}`, {
      headers: buildHeaders(session?.accessToken),
    });
    if (res.status === 200) {
      const data = await res.json();
      return data.data as AdminSangaku;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchAdminShrines(
  page?: number,
  query?: string,
): Promise<{ shrines: AdminShrine[]; totalPages: number }> {
  const session = await auth();
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.set("page", String(page));
    if (query) params.set("query", query);
    const res = await fetch(`${apiUrl}/api/v1/admin/shrines?${params}`, {
      headers: buildHeaders(session?.accessToken),
    });
    if (res.status === 200) {
      const data = await res.json();
      const totalPages = Number(res.headers.get("total-pages") ?? 1);
      return { shrines: data.data as AdminShrine[], totalPages };
    }
    return { shrines: [], totalPages: 1 };
  } catch {
    return { shrines: [], totalPages: 1 };
  }
}

export async function fetchAdminShrine(id: string): Promise<AdminShrine | null> {
  const session = await auth();
  try {
    const res = await fetch(`${apiUrl}/api/v1/admin/shrines/${id}`, {
      headers: buildHeaders(session?.accessToken),
    });
    if (res.status === 200) {
      const data = await res.json();
      return data.data as AdminShrine;
    }
    return null;
  } catch {
    return null;
  }
}
