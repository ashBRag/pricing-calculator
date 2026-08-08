import { HttpException, HttpStatus } from '@nestjs/common';

export class AppError extends HttpException {
  constructor(code: string, message: string, status: HttpStatus) {
    super({ code, message }, status);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required.') {
    super('AUTHENTICATION_ERROR', message, HttpStatus.UNAUTHORIZED);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have access to this resource.') {
    super('AUTHORIZATION_ERROR', message, HttpStatus.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super('NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, HttpStatus.CONFLICT);
  }
}

export class DocumentFinalizedError extends AppError {
  constructor(message = 'Finalized documents cannot be modified.') {
    super('DOCUMENT_FINALIZED', message, HttpStatus.CONFLICT);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'A database error occurred.') {
    super('DATABASE_ERROR', message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
