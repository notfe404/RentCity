/**
 * Utility to handle payment errors gracefully
 * Provides consistent error messages and recovery options
 */

export type PaymentErrorType = 'network' | 'validation' | 'server' | 'timeout' | 'unknown';

export interface PaymentError {
  type: PaymentErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
}

export function parsePaymentError(error: unknown): PaymentError {
  // Handle network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      type: 'network',
      message: 'Network error',
      userMessage: 'Connection error. Please check your internet and try again.',
      recoverable: true,
    };
  }

  // Handle timeout
  if (error instanceof Error && error.message.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'Request timeout',
      userMessage: 'The request timed out. Please try again.',
      recoverable: true,
    };
  }

  // Handle API errors
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as {
      response?: {
        status?: number;
        data?: Record<string, string | { message: string }>;
      };
    };

    const status = apiError.response?.status;
    const data = apiError.response?.data;

    // 400 Bad Request - Validation error
    if (status === 400) {
      const errorMessage = extractErrorMessage(data);
      return {
        type: 'validation',
        message: errorMessage,
        userMessage: errorMessage || 'Invalid data. Please check again.',
        recoverable: true,
      };
    }

    // 401 Unauthorized
    if (status === 401) {
      return {
        type: 'validation',
        message: 'Unauthorized',
        userMessage: 'Your session has expired. Please log in again.',
        recoverable: false,
      };
    }

    // 403 Forbidden
    if (status === 403) {
      return {
        type: 'validation',
        message: 'Forbidden',
        userMessage: 'You do not have permission to perform this action.',
        recoverable: false,
      };
    }

    // 404 Not Found
    if (status === 404) {
      return {
        type: 'validation',
        message: 'Not found',
        userMessage: 'Booking does not exist. Please check again.',
        recoverable: false,
      };
    }

    // 409 Conflict
    if (status === 409) {
      return {
        type: 'validation',
        message: 'Conflict',
        userMessage: 'This booking has already been processed. Please go back and check.',
        recoverable: false,
      };
    }

    // 500+ Server errors
    if (status && status >= 500) {
      return {
        type: 'server',
        message: 'Server error',
        userMessage: 'Server error. Please try again later.',
        recoverable: true,
      };
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      type: 'unknown',
      message: error.message,
      userMessage: error.message || 'An error occurred. Please try again.',
      recoverable: true,
    };
  }

  // Unknown error
  return {
    type: 'unknown',
    message: 'Unknown error',
    userMessage: 'An unknown error occurred. Please try again.',
    recoverable: true,
  };
}

function extractErrorMessage(data: Record<string, string | { message: string }> | undefined): string {
  if (!data) return '';

  // Check for error field
  if (data.error && typeof data.error === 'string') {
    return data.error;
  }

  // Check for message field
  if (data.message && typeof data.message === 'string') {
    return data.message;
  }

  // Check for nested message object
  const firstValue = Object.values(data)[0];
  if (firstValue && typeof firstValue === 'object' && 'message' in firstValue) {
    return (firstValue as { message: string }).message;
  }

  // Return first string value
  const firstString = Object.values(data).find((v) => typeof v === 'string');
  if (firstString && typeof firstString === 'string') {
    return firstString;
  }

  return '';
}

/**
 * Safe wrapper for payment API calls with error handling
 */
export async function safePaymentCall<T>(
  fn: () => Promise<T>,
  options?: {
    onError?: (error: PaymentError) => void;
  },
): Promise<{ data: T | null; error: PaymentError | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const paymentError = parsePaymentError(error);
    options?.onError?.(paymentError);
    return { data: null, error: paymentError };
  }
}
