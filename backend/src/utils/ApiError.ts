import { StatusCodes } from 'http-status-codes';

// ─── API Error ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: { field: string; message: string }[];

  constructor(
    a: string | number,
    b: number | string = StatusCodes.INTERNAL_SERVER_ERROR,
    errors?: { field: string; message: string }[]
  ) {
    // Support both constructor signatures:
    // new ApiError(message, statusCode) and new ApiError(statusCode, message)
    let message: string;
    let statusCode: number;

    if (typeof a === 'number') {
      statusCode = a;
      message = typeof b === 'string' ? b : String(b);
    } else {
      message = a;
      statusCode = typeof b === 'number' ? b : StatusCodes.INTERNAL_SERVER_ERROR;
    }

    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: { field: string; message: string }[]) {
    return new ApiError(message, StatusCodes.BAD_REQUEST, errors);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(message, StatusCodes.UNAUTHORIZED);
  }

  static forbidden(message = 'Access denied') {
    return new ApiError(message, StatusCodes.FORBIDDEN);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, StatusCodes.NOT_FOUND);
  }

  static conflict(message: string) {
    return new ApiError(message, StatusCodes.CONFLICT);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(message, StatusCodes.TOO_MANY_REQUESTS);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(message, StatusCodes.INTERNAL_SERVER_ERROR);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new ApiError(message, StatusCodes.SERVICE_UNAVAILABLE);
  }
}

// ─── API Response ─────────────────────────────────────────────────────────────

export class ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse<T>(true, message, data);
  }

  static error(message: string): ApiResponse {
    return new ApiResponse(false, message);
  }

  withPagination(pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }): this {
    this.pagination = pagination;
    return this;
  }
}
