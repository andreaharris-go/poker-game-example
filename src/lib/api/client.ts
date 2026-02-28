export type HeaderProfile = {
  id: string;
  name: string;
  vendorId: string;
  providerId: string;
  userId: string;
  adminKey: string;
};

export type ApiRequest = {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: object | null;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
};

export type ApiResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  rawBody: string;
  duration: number;
  timestamp: string;
};

export type NetworkLogEntry = {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  status: number;
  responseBody: unknown;
  duration: number;
};

type NetworkLogListener = () => void;

const MAX_NETWORK_LOG = 200;
const networkLog: NetworkLogEntry[] = [];
const listeners: Set<NetworkLogListener> = new Set();

export function addToNetworkLog(entry: NetworkLogEntry): void {
  networkLog.unshift(entry);
  if (networkLog.length > MAX_NETWORK_LOG) {
    networkLog.length = MAX_NETWORK_LOG;
  }
  listeners.forEach((fn) => fn());
}

export function getNetworkLog(): NetworkLogEntry[] {
  return [...networkLog];
}

export function onNetworkLogChange(listener: NetworkLogListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function sendRequest(
  baseUrl: string,
  profile: HeaderProfile,
  request: ApiRequest,
  idempotencyKey?: string,
): Promise<ApiResponse> {
  // Replace path params
  let resolvedPath = request.path;
  for (const [key, value] of Object.entries(request.pathParams)) {
    resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(value));
  }

  // Build URL with query params
  const url = new URL(resolvedPath, baseUrl);
  for (const [key, value] of Object.entries(request.queryParams)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    "x-vendor-id": profile.vendorId,
    "x-provider-id": profile.providerId,
    ...request.headers,
  };

  if (profile.userId) {
    headers["x-user-id"] = profile.userId;
  }
  if (profile.adminKey) {
    headers["x-admin-key"] = profile.adminKey;
  }
  if (idempotencyKey) {
    headers["x-idempotency-key"] = idempotencyKey;
  }
  if (request.body) {
    headers["Content-Type"] = "application/json";
  }

  const start = performance.now();

  const fetchOptions: RequestInit = {
    method: request.method.toUpperCase(),
    headers,
  };
  if (request.body) {
    fetchOptions.body = JSON.stringify(request.body);
  }

  const res = await fetch(url.toString(), fetchOptions);
  const duration = Math.round(performance.now() - start);

  const rawBody = await res.text();
  let body: unknown = rawBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // response is not JSON — keep as raw text
  }

  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  const timestamp = new Date().toISOString();

  const apiResponse: ApiResponse = {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
    body,
    rawBody,
    duration,
    timestamp,
  };

  // Log to network log
  addToNetworkLog({
    id: crypto.randomUUID(),
    timestamp,
    method: request.method.toUpperCase(),
    url: url.toString(),
    requestHeaders: headers,
    requestBody: request.body,
    status: res.status,
    responseBody: body,
    duration,
  });

  return apiResponse;
}
