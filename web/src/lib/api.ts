/* eslint-disable @typescript-eslint/no-explicit-any */

export class ApiError extends Error {
  status: number;
  constructor(message: string | undefined, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchApi(
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
) {
  const url = `${process.env.NEXT_PUBLIC_API_URL || ""}/api${endpoint}`;
  console.log("url", url);

  try {
    const requestOptions: RequestInit = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    // Only add body if it exists and method is not GET
    if (options.body && options.method !== "GET") {
      requestOptions.body =
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body);
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Network error occurred", 500);
  }
}
