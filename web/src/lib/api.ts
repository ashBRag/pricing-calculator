export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface FetchApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
}

async function request<T>(
  url: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const requestInit: RequestInit = {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  };

  if (options.body !== undefined && options.method !== "GET") {
    requestInit.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, requestInit);
  const isJson = response.headers
    .get("Content-Type")
    ?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      data?.error?.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data?.error?.code);
  }

  return data as T;
}

export function fetchApi<T>(
  endpoint: string,
  options?: FetchApiOptions
): Promise<T> {
  return request<T>(`/api/backend${endpoint}`, options);
}

export function authApi<T>(
  endpoint: string,
  options?: FetchApiOptions
): Promise<T> {
  return request<T>(`/api/auth${endpoint}`, options);
}
