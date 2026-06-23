import { auth } from "@/auth";
import { buildHeaders } from "@/app/lib/client_headers";
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
    const res = await fetch(`${apiUrl}/api/v1/user/answer_results/${id}`, {
      headers: buildHeaders(session?.accessToken),
      cache: "no-store",
    });

    const body = res.status === 200 ? await res.json() : null;
    return Response.json(body, { status: res.status });
  } catch (error) {
    console.error("[api/answer-results] GET error:", error);
    return Response.json(null, { status: 500 });
  }
}
