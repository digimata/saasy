type StatusCode = 400 | 401 | 403 | 404 | 409 | 500 | 501 | 503;

export abstract class APIError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: StatusCode;
  public metadata?: unknown;

  constructor(message: string, metadata?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = metadata;
  }

  json() {
    const body = {
      error: { code: this.code, message: this.message },
    };
    if (this.metadata && typeof this.metadata === "object") {
      Object.assign(body.error, this.metadata);
    }
    return body;
  }
}

export class ValidationError extends APIError {
  readonly code = "validation_error";
  readonly statusCode = 400;
  constructor(message = "Invalid request data", metadata?: unknown) {
    super(message, metadata);
  }
}

export class UnauthorizedError extends APIError {
  readonly code = "unauthorized";
  readonly statusCode = 401;
  constructor(message = "Authentication required", metadata?: unknown) {
    super(message, metadata);
  }
}

export class ForbiddenError extends APIError {
  readonly code = "forbidden";
  readonly statusCode = 403;
  constructor(message = "Forbidden", metadata?: unknown) {
    super(message, metadata);
  }
}

export class NotFoundError extends APIError {
  readonly code = "not_found";
  readonly statusCode = 404;
  constructor(message = "Resource not found", metadata?: unknown) {
    super(message, metadata);
  }
}

export class ConflictError extends APIError {
  readonly code = "conflict";
  readonly statusCode = 409;
  constructor(message = "Resource conflict", metadata?: unknown) {
    super(message, metadata);
  }
}

export class InternalServerError extends APIError {
  readonly code = "internal_server_error";
  readonly statusCode = 500;
  constructor(message = "Internal server error", metadata?: unknown) {
    super(message, metadata);
  }
}

export class ServiceUnavailableError extends APIError {
  readonly code = "service_unavailable";
  readonly statusCode = 503;
  constructor(message = "Service unavailable", metadata?: unknown) {
    super(message, metadata);
  }
}
