import { auth } from "@/auth";
import { MyProfile, PublicProfile } from "../definitions";
import { buildHeaders } from "@/app/lib/client_headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { apiUrl } from "@/app/lib/config";

export async function fetchMyProfile(): Promise<MyProfile | undefined> {
  const session = await auth();

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/profile`, {
      headers: buildHeaders(session?.accessToken),
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
    const res = await fetch(`${apiUrl}/api/v1/profiles/${id}`, {
      headers: buildHeaders(),
    });

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
