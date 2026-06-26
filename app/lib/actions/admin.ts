"use server";

import { auth } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { setFlash } from "@/app/lib/actions/flash";
import { customSignOut } from "@/app/lib/actions/auth";
import { serverFetch } from "@/app/lib/server-fetch";

const apiUrl = process.env.API_URL!;

async function requireAdmin() {
  const session = await auth();
  if (session?.role !== "admin") return null;
  return session;
}

export async function updateUserRole(
  id: string,
  role: "general" | "admin",
): Promise<boolean> {
  const session = await requireAdmin();
  if (!session) {
    await setFlash({ type: "error", message: "この操作は許可されていません" });
    return false;
  }
  try {
    const res = await serverFetch(`${apiUrl}/api/v1/admin/users/${id}`, {
      method: "PATCH",
      token: session.accessToken,
      body: JSON.stringify({ user: { role } }),
    });
    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "ロールを変更しました" });
        revalidatePath("/admin/users");
        return true;
      case 401:
        await setFlash({
          type: "error",
          message: "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await customSignOut();
        return false;
      case 403:
        await setFlash({ type: "error", message: "この操作は許可されていません" });
        return false;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return false;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return false;
  }
}

export async function updateUser(
  id: string,
  formData: FormData,
): Promise<boolean> {
  const session = await requireAdmin();
  if (!session) {
    await setFlash({ type: "error", message: "この操作は許可されていません" });
    return false;
  }
  const role = formData.get("role");
  if (role !== "general" && role !== "admin") {
    await setFlash({ type: "error", message: "不正なロール値です" });
    return false;
  }
  const body = {
    user: {
      name: formData.get("name"),
      nickname: formData.get("nickname"),
      role,
    },
  };
  try {
    const res = await serverFetch(`${apiUrl}/api/v1/admin/users/${id}`, {
      method: "PATCH",
      token: session.accessToken,
      body: JSON.stringify(body),
    });
    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "ユーザーを更新しました" });
        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${id}/edit`);
        return true;
      case 401:
        await setFlash({
          type: "error",
          message: "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await customSignOut();
        return false;
      case 403:
        await setFlash({ type: "error", message: "この操作は許可されていません" });
        return false;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return false;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return false;
  }
}

export async function deleteSangaku(id: string): Promise<boolean> {
  const session = await requireAdmin();
  if (!session) {
    await setFlash({ type: "error", message: "この操作は許可されていません" });
    return false;
  }
  try {
    const res = await serverFetch(`${apiUrl}/api/v1/admin/sangakus/${id}`, {
      method: "DELETE",
      token: session.accessToken,
    });
    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "算額を削除しました" });
        revalidatePath("/admin/sangakus");
        return true;
      case 401:
        await setFlash({
          type: "error",
          message: "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await customSignOut();
        return false;
      case 403:
        await setFlash({ type: "error", message: "この操作は許可されていません" });
        return false;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return false;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return false;
  }
}

export async function updateSangaku(
  id: string,
  formData: FormData,
): Promise<boolean> {
  const session = await requireAdmin();
  if (!session) {
    await setFlash({ type: "error", message: "この操作は許可されていません" });
    return false;
  }
  const body = {
    sangaku: {
      title: formData.get("title"),
      difficulty: formData.get("difficulty"),
      description: formData.get("description"),
      source: formData.get("source"),
    },
  };
  try {
    const res = await serverFetch(`${apiUrl}/api/v1/admin/sangakus/${id}`, {
      method: "PATCH",
      token: session.accessToken,
      body: JSON.stringify(body),
    });
    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "算額を更新しました" });
        revalidatePath("/admin/sangakus");
        revalidatePath(`/admin/sangakus/${id}/edit`);
        return true;
      case 401:
        await setFlash({
          type: "error",
          message: "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await customSignOut();
        return false;
      case 403:
        await setFlash({ type: "error", message: "この操作は許可されていません" });
        return false;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return false;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return false;
  }
}

export async function createShrine(formData: FormData): Promise<boolean> {
  const session = await requireAdmin();
  if (!session) {
    await setFlash({ type: "error", message: "この操作は許可されていません" });
    return false;
  }
  const latStr = formData.get("latitude");
  const lonStr = formData.get("longitude");
  const latitude =
    latStr !== null && latStr !== "" ? Number(latStr) : null;
  const longitude =
    lonStr !== null && lonStr !== "" ? Number(lonStr) : null;
  if (
    latitude === null ||
    longitude === null ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    await setFlash({ type: "error", message: "緯度・経度は必須です" });
    return false;
  }
  const body = {
    shrine: {
      name: formData.get("name"),
      address: formData.get("address"),
      latitude,
      longitude,
      place_id: formData.get("place_id"),
    },
  };
  try {
    const res = await serverFetch(`${apiUrl}/api/v1/admin/shrines`, {
      method: "POST",
      token: session.accessToken,
      body: JSON.stringify(body),
    });
    switch (res.status) {
      case 201:
        await setFlash({ type: "success", message: "神社を作成しました" });
        revalidatePath("/admin/shrines");
        return true;
      case 401:
        await setFlash({
          type: "error",
          message: "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await customSignOut();
        return false;
      case 403:
        await setFlash({ type: "error", message: "この操作は許可されていません" });
        return false;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return false;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return false;
  }
}

export async function updateShrine(
  id: string,
  formData: FormData,
): Promise<boolean> {
  const session = await requireAdmin();
  if (!session) {
    await setFlash({ type: "error", message: "この操作は許可されていません" });
    return false;
  }
  const body = {
    shrine: {
      name: formData.get("name"),
    },
  };
  try {
    const res = await serverFetch(`${apiUrl}/api/v1/admin/shrines/${id}`, {
      method: "PATCH",
      token: session.accessToken,
      body: JSON.stringify(body),
    });
    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "神社を更新しました" });
        revalidatePath("/admin/shrines");
        revalidatePath(`/admin/shrines/${id}/edit`);
        return true;
      case 401:
        await setFlash({
          type: "error",
          message: "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await customSignOut();
        return false;
      case 403:
        await setFlash({ type: "error", message: "この操作は許可されていません" });
        return false;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return false;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return false;
  }
}

export async function deleteShrine(id: string): Promise<boolean> {
  const session = await requireAdmin();
  if (!session) {
    await setFlash({ type: "error", message: "この操作は許可されていません" });
    return false;
  }
  try {
    const res = await serverFetch(`${apiUrl}/api/v1/admin/shrines/${id}`, {
      method: "DELETE",
      token: session.accessToken,
    });
    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "神社を削除しました" });
        revalidatePath("/admin/shrines");
        return true;
      case 401:
        await setFlash({
          type: "error",
          message: "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await customSignOut();
        return false;
      case 403:
        await setFlash({ type: "error", message: "この操作は許可されていません" });
        return false;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return false;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return false;
  }
}
