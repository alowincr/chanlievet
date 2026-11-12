import type { StaffUser } from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const AUTH_STORAGE_KEY = "chanlievet-auth";

interface StoredAuth {
  token: string;
  user: StaffUser;
}

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth: StoredAuth): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Adjunta el token del staff si existe (comportamiento por defecto). */
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth !== false) {
    const token = getStoredAuth()?.token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "No se pudo conectar con el servidor. Verifica que el API esté en ejecución.",
    );
  }

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const payload = data as { error?: string; details?: unknown } | null;
    throw new ApiError(
      response.status,
      payload?.error ?? `Error ${response.status} al conectar con el servidor`,
      payload?.details,
    );
  }

  return data as T;
}

/** Extrae un mensaje legible de los detalles de validación del API. */
export function describeApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (Array.isArray(error.details)) {
      const messages = error.details
        .map((item) =>
          typeof item === "object" && item !== null && "message" in item
            ? String((item as { message: unknown }).message)
            : null,
        )
        .filter((message): message is string => Boolean(message));

      if (messages.length > 0) return messages.join(". ");
    }

    return error.message;
  }

  return "Ocurrió un error inesperado. Intenta nuevamente.";
}
