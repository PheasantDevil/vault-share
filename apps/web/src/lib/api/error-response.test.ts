import { describe, it, expect } from 'vitest';
import { createErrorResponse, ErrorCode } from './error-response';

describe('error-response', () => {
  describe('createErrorResponse', () => {
    it('should create error response with code and message', () => {
      const response = createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed');
      expect(response).toEqual({
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
        },
      });
    });

    it('should create error response with details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const response = createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        details
      );
      expect(response).toEqual({
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details,
        },
      });
    });

    it('should handle all error codes', () => {
      const codes = Object.values(ErrorCode);
      codes.forEach((code) => {
        const response = createErrorResponse(code, 'Test message');
        expect(response.error.code).toBe(code);
        expect(response.error.message).toBe('Test message');
      });
    });
  });
});
