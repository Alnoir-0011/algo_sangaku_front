import { auth } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { serverFetch } from "@/app/lib/server-fetch";
import { apiUrl } from "@/app/lib/config";
import type { AdminUser, AdminSangaku, AdminShrine, AdminStats } from "@/app/lib/definitions";

async function requireAdmin() {
  const session = await auth();
  if (session?.role !== "admin") return null;
  return session;
}

export async function fetchAdminStats(): Promise<AdminStats | undefined | null> {
  const session = await requireAdmin();
  if (!session) return undefined;
  try {
    const res = await serverFetch(`${apiUrl}/api/v1/admin/stats`, {
      token: session.accessToken,
    });
    switch (res.status) {
      case 200:
        const data = await res.json();
        return data.data as AdminStats;
      case 401:
      case 403:
        return undefined;
      default:
        return null;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[data/admin] fetchAdminStats error:", error);
    return null;
  }
}

export async function fetchAdminUsers(
  page?: number,
  query?: string,
  sort?: "asc" | "desc",
): Promise<{ users: AdminUser[]; totalPages: number } | undefined | null> {
  const session = await requireAdmin();
  if (!session) return undefined;
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.set("page", String(page));
    if (query) params.set("query", query);
    if (sort) params.set("sort", sort);
    const res = await serverFetch(`${apiUrl}/api/v1/admin/users?${params}`, {
      token: session.accessToken,
    });
    switch (res.status) {
      case 200:
        const data = await res.json();
        const totalPages = Number(res.headers.get("total-pages") ?? 1);
        return { users: data.data as AdminUser[], totalPages };
      case 401:
      case 403:
        return undefined;
      default:
        return null;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[data/admin] fetchAdminUsers error:", error);
    return null;
  }
}

export async function fetchAdminUser(id: string): Promise<AdminUser | undefined | null> {
  const session = await requireAdmin();
  if (!session) return undefined;
  try {
    const res = await serverFetch(`${apiUrl}/api/v1/admin/users/${id}`, {
      token: session.accessToken,
    });
    switch (res.status) {
      case 200:
        const data = await res.json();
        return data.data as AdminUser;
      case 401:
      case 403:
        return undefined;
      case 404:
        return null;
      default:
        console.error(`[data/admin] fetchAdminUser unexpected status: ${res.status}`);
        return undefined;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[data/admin] fetchAdminUser error:", error);
    return undefined;
  }
}

export async function fetchAdminSangakus(
  page?: number,
  query?: string,
): Promise<{ sangakus: AdminSangaku[]; totalPages: number } | undefined | null> {
  const session = await requireAdmin();
  if (!session) return undefined;
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.set("page", String(page));
    if (query) params.set("query", query);
    const res = await serverFetch(`${apiUrl}/api/v1/admin/sangakus?${params}`, {
      token: session.accessToken,
    });
    switch (res.status) {
      case 200:
        const data = await res.json();
        const totalPages = Number(res.headers.get("total-pages") ?? 1);
        return { sangakus: data.data as AdminSangaku[], totalPages };
      case 401:
      case 403:
        return undefined;
      default:
        return null;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[data/admin] fetchAdminSangakus error:", error);
    return null;
  }
}

export async function fetchAdminSangaku(id: string): Promise<AdminSangaku | undefined | null> {
  const session = await requireAdmin();
  if (!session) return undefined;
  try {
    const res = await serverFetch(`${apiUrl}/api/v1/admin/sangakus/${id}`, {
      token: session.accessToken,
    });
    switch (res.status) {
      case 200:
        const data = await res.json();
        return data.data as AdminSangaku;
      case 401:
      case 403:
        return undefined;
      case 404:
        return null;
      default:
        console.error(`[data/admin] fetchAdminSangaku unexpected status: ${res.status}`);
        return undefined;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[data/admin] fetchAdminSangaku error:", error);
    return undefined;
  }
}

export async function fetchAdminShrines(
  page?: number,
  query?: string,
): Promise<{ shrines: AdminShrine[]; totalPages: number } | undefined | null> {
  const session = await requireAdmin();
  if (!session) return undefined;
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.set("page", String(page));
    if (query) params.set("query", query);
    const res = await serverFetch(`${apiUrl}/api/v1/admin/shrines?${params}`, {
      token: session.accessToken,
    });
    switch (res.status) {
      case 200:
        const data = await res.json();
        const totalPages = Number(res.headers.get("total-pages") ?? 1);
        return { shrines: data.data as AdminShrine[], totalPages };
      case 401:
      case 403:
        return undefined;
      default:
        return null;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[data/admin] fetchAdminShrines error:", error);
    return null;
  }
}

export async function fetchAdminShrine(id: string): Promise<AdminShrine | undefined | null> {
  const session = await requireAdmin();
  if (!session) return undefined;
  try {
    const res = await serverFetch(`${apiUrl}/api/v1/admin/shrines/${id}`, {
      token: session.accessToken,
    });
    switch (res.status) {
      case 200:
        const data = await res.json();
        return data.data as AdminShrine;
      case 401:
      case 403:
        return undefined;
      case 404:
        return null;
      default:
        console.error(`[data/admin] fetchAdminShrine unexpected status: ${res.status}`);
        return undefined;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[data/admin] fetchAdminShrine error:", error);
    return undefined;
  }
}
