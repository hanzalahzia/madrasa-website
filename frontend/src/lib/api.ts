export class ApiError extends Error {
  status: number;
  details?: Array<{ path?: string; message?: string }> | unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  raw?: boolean;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, raw, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders);
  let requestBody: BodyInit | undefined;

  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: "include",
      ...rest,
      headers,
      body: requestBody
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.", 0);
  }

  if (raw) {
    if (!response.ok) throw new ApiError("The requested file could not be loaded.", response.status);
    return response as unknown as T;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message)
        : typeof data === "string" && data
          ? data
          : "The request could not be completed.";
    throw new ApiError(message, response.status, (data as Record<string, unknown>)?.details);
  }

  return data as T;
}

export function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    search.set(key, String(value));
  }
  const output = search.toString();
  return output ? `?${output}` : "";
}

export async function uploadImage(file: File): Promise<{ url: string; originalName: string; size: number }> {
  const form = new FormData();
  form.append("file", file);
  return api("/admin/uploads", { method: "POST", body: form });
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

export function fieldError(error: unknown): string | null {
  if (error instanceof ApiError && Array.isArray(error.details) && error.details.length > 0) {
    const first = error.details[0] as { message?: string };
    if (first?.message) return first.message;
  }
  return null;
}
