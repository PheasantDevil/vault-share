/**
 * 標準化されたエラーレスポンス形式
 */

export enum ErrorCode {
  // 認証エラー
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // バリデーションエラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // リソースエラー
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // サーバーエラー
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // ビジネスロジックエラー
  OPERATION_FAILED = 'OPERATION_FAILED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
}

export interface ErrorResponse {
  error: {
    code: ErrorCode | string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}
