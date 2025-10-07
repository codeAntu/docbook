// Unified response creator for RPC-friendly structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  error: unknown | null;
  timestamp: string;
}

function createResponse<T = unknown>({
  success,
  message,
  data = null,
  error = null,
  statusCode = 200,
}: {
  success: boolean;
  message: string;
  data?: T | null;
  error?: unknown;
  statusCode?: number;
}): ApiResponse<T> {
  return {
    success,
    statusCode,
    message,
    data: data ?? null,
    error: error ?? null,
    timestamp: new Date().toISOString(),
  };
}

const Responses = {
  success: <T>(message: string, data?: T) =>
    createResponse<T>({ success: true, message, data }),
  created: <T>(message: string, data: T) =>
    createResponse<T>({ success: true, message, data, statusCode: 201 }),
  updated: <T>(message: string, data: T) =>
    createResponse<T>({ success: true, message, data }),
  deleted: (message: string) => createResponse({ success: true, message }),
  error: (message: string, error: unknown, statusCode: number = 500) =>
    createResponse({ success: false, message, error, statusCode }),
  notFound: (resource: string = "resource") =>
    createResponse({
      success: false,
      message: `${resource} not found`,
      error: new Error("Not Found"),
      statusCode: 404,
    }),
  badRequest: (message: string) =>
    createResponse({
      success: false,
      message,
      error: new Error("Bad Request"),
      statusCode: 400,
    }),
  unauthorized: (message: string = "Unauthorized access.") =>
    createResponse({
      success: false,
      message,
      error: new Error("Unauthorized"),
      statusCode: 401,
    }),
  alreadyExists: (resource: string) =>
    createResponse({
      success: false,
      message: `${resource} already exists`,
      error: new Error("Conflict"),
      statusCode: 409,
    }),
  serverError: (message: string, error?: unknown) =>
    createResponse({
      success: false,
      message,
      error: error || new Error("Internal Server Error"),
      statusCode: 500,
    }),
  forbidden: (message: string = "Forbidden") =>
    createResponse({
      success: false,
      message,
      error: new Error("Forbidden"),
      statusCode: 403,
    }),
  validationError: (errors: string[]) =>
    createResponse({
      success: false,
      message: "Validation error",
      error: new Error(`Validation failed: ${errors.join(", ")}`),
      statusCode: 422,
    }),
  tooManyRequests: (message: string = "Too many requests") =>
    createResponse({
      success: false,
      message,
      error: new Error("Too Many Requests"),
      statusCode: 429,
    }),
};

export { createResponse, Responses };
// ApiResponse is already exported as an interface, so no need to export again
