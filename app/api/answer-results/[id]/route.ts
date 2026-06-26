import { auth } from "@/auth";
import { serverFetch } from "@/app/lib/server-fetch";
import { NextRequest } from "next/server";
import { apiUrl } from "@/app/lib/config";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return Response.json(null, { status: 400 });
  }

  const session = await auth();

  if (!session?.accessToken) {
    return Response.json(null, { status: 401 });
  }

  try {
    const res = await serverFetch(`${apiUrl}/api/v1/user/answer_results/${id}`, {
      token: session?.accessToken,
      cache: "no-store",
    });

    const body = res.status === 200 ? await res.json() : null;
    return Response.json(body, { status: res.status });
  } catch (error) {
    console.error("[api/answer-results] GET error:", error);
    return Response.json(null, { status: 500 });
  }
}
