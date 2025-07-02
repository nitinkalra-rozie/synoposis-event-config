import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, throwError } from 'rxjs';

export interface AuthError {
  type:
    | 'UNAUTHENTICATED'
    | 'UNAUTHORIZED'
    | 'TOKEN_EXPIRED'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';
  message: string;
  originalError?: any;
}

export const authErrorHandlerFn = (): (<T = any>(
  error: any,
  shouldRedirect: boolean
) => Observable<T | null>) => {
  const router = inject(Router);

  return <T = any>(
    error: any,
    shouldRedirect: boolean = true
  ): Observable<T | null> => {
    const authError = classifyError(error);

    switch (authError.type) {
      case 'UNAUTHENTICATED':
        if (shouldRedirect) {
          router.navigate(['/login']);
        }
        return EMPTY;

      case 'UNAUTHORIZED':
        if (shouldRedirect) {
          router.navigate(['/unauthorized']);
        }
        return EMPTY;

      case 'TOKEN_EXPIRED':
        if (shouldRedirect) {
          router.navigate(['/login']);
        }
        return EMPTY;

      case 'NETWORK_ERROR':
        router.navigate(['/login']);
        return EMPTY;

      default:
        return throwError(() => authError.originalError);
    }
  };
};

const classifyError = (error: any): AuthError => {
  if (!error) {
    return {
      type: 'UNKNOWN',
      message: 'Unknown error occurred',
      originalError: error,
    };
  }

  const errorMessage = error.message || error.toString();
  const errorName = error.name || '';

  if (
    errorMessage.includes('UserUnAuthenticatedException') ||
    errorMessage.includes('User needs to be authenticated')
  ) {
    return {
      type: 'UNAUTHENTICATED',
      message: 'User is not authenticated',
      originalError: error,
    };
  }

  if (
    errorMessage.includes('AccessDeniedException') ||
    errorMessage.includes('UnauthorizedException')
  ) {
    return {
      type: 'UNAUTHORIZED',
      message: 'User is not authorized to access this resource',
      originalError: error,
    };
  }

  if (
    errorMessage.includes('TokenExpiredException') ||
    errorMessage.includes('Token has expired')
  ) {
    return {
      type: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired',
      originalError: error,
    };
  }

  if (error.status === 401) {
    return {
      type: 'UNAUTHENTICATED',
      message: 'Authentication required',
      originalError: error,
    };
  }

  if (error.status === 403) {
    return {
      type: 'UNAUTHORIZED',
      message: 'Access forbidden',
      originalError: error,
    };
  }

  if (error.status === 0) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Network connection error',
      originalError: error,
    };
  }

  return {
    type: 'UNKNOWN',
    message: errorMessage || 'An unknown error occurred',
    originalError: error,
  };
};
