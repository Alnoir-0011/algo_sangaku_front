import { auth } from "@/auth";
import { MyProfile, PublicProfile } from "../definitions";
import { serverFetch } from "@/app/lib/server-fetch";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { apiUrl } from "@/app/lib/config";

export async function fetchMyProfile(): Promise<MyProfile | undefined> {
  const session = await auth();

  try {
    const res = await serverFetch(`${apiUrl}/api/v1/user/profile`, {
      token: session?.accessToken,
    });

    if (res.status === 200) {
      const body = await res.json();
      return body.data as MyProfile;
    }
    return undefined;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[data/profile] fetchMyProfile error:", error);
    return undefined;
  }
}

export async function fetchPublicProfile(
  id: string,
): Promise<PublicProfile | undefined> {
  if (!/^\d+$/.test(id)) {
    return undefined;
  }

  try {
    const res = await serverFetch(`${apiUrl}/api/v1/profiles/${id}`);

    if (res.status === 200) {
      const body = await res.json();
      return body.data as PublicProfile;
    }
    return undefined;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[data/profile] fetchPublicProfile error:", error);
    return undefined;
  }
}
