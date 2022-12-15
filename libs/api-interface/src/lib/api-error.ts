export class ValidationError extends Error {
  name = 'ValidationError';
}

export class UnAuthorizedError extends Error {
  name = 'UnAuthorizedError';
}

export class NotFoundError extends Error {
  name: 'NotFoundError';
}

export class TargetNotFoundError extends Error {
  name: 'TargetNotFoundError';
}

export class DuplicateError extends Error {
  name: 'DuplicateError';
}
