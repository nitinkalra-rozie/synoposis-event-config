import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, throwError } from 'rxjs';
import {
  HTTP_STATUS_CODE,
  TOKEN_REFRESH_ERRORS,
} from 'src/app/core/auth/constants/auth-constants';

export type PossibleError =
  | HttpError
  | AwsCognitoError
  | NetworkError
  | JavaScriptError
  | UnknownError;

interface HttpError {
  status: number;
  message?: string;
  error?: any;
}

interface AwsCognitoError {
  message: string;
  name?: string;
  code?: string;
}

interface NetworkError {
  status: 0;
  message?: string;
}

interface JavaScriptError {
  message: string;
  name?: string;
  stack?: string;
}

interface UnknownError {
  toString?: () => string;
  message?: string;
}

export interface AuthError {
  type:
    | 'UNAUTHENTICATED'
    | 'UNAUTHORIZED'
    | 'TOKEN_EXPIRED'
    | 'REFRESH_TOKEN_EXPIRED'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR';
  message: string;
  originalError?: PossibleError;
}

export const authErrorHandlerFn = (): (<T>(
  error: PossibleError,
  shouldRedirectToLogin: boolean
) => Observable<T | null>) => {
  const router = inject(Router);

  return <T>(
    error: PossibleError,
    shouldRedirectToLogin: boolean = true
  ): Observable<T | null> => {
    const authError = classifyError(error);

    switch (authError.type) {
      case 'UNAUTHENTICATED':
        if (shouldRedirectToLogin) {
          router.navigate(['/login']);
        }
        return EMPTY;

      case 'UNAUTHORIZED':
        if (shouldRedirectToLogin) {
          router.navigate(['/unauthorized']);
        }
        return EMPTY;

      case 'TOKEN_EXPIRED':
      case 'REFRESH_TOKEN_EXPIRED':
        if (shouldRedirectToLogin) {
          router.navigate(['/login']);
        }
        return EMPTY;

      case 'NETWORK_ERROR':
        if (shouldRedirectToLogin) {
          router.navigate(['/login']);
        }
        return throwError(() => authError);

      default:
        return throwError(() => authError.originalError);
    }
  };
};

export const classifyError = (error: PossibleError): AuthError => {
  const errorMessage = getErrorMessage(error);
  const status = getErrorStatus(error);

  const rules: {
    match: () => boolean;
    result: Omit<AuthError, 'originalError'>;
  }[] = [
    {
      match: () =>
        errorMessage.includes('RefreshTokenExpiredException') ||
        errorMessage.includes('refresh token has expired') ||
        errorMessage.includes('Refresh Token has expired'),
      result: {
        type: 'REFRESH_TOKEN_EXPIRED',
        message: TOKEN_REFRESH_ERRORS.REFRESH_TOKEN_EXPIRED,
      },
    },
    {
      match: () =>
        errorMessage.includes('TokenExpiredException') ||
        errorMessage.includes('Token has expired'),
      result: {
        type: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
    },
    {
      match: () =>
        errorMessage.includes('UserUnAuthenticatedException') ||
        errorMessage.includes('User needs to be authenticated') ||
        status === HTTP_STATUS_CODE.UNAUTHORIZED,
      result: {
        type: 'UNAUTHENTICATED',
        message: TOKEN_REFRESH_ERRORS.UNAUTHORIZED,
      },
    },
    {
      match: () =>
        errorMessage.includes('AccessDeniedException') ||
        errorMessage.includes('UnauthorizedException') ||
        status === HTTP_STATUS_CODE.FORBIDDEN,
      result: {
        type: 'UNAUTHORIZED',
        message: TOKEN_REFRESH_ERRORS.UNAUTHORIZED,
      },
    },
    {
      match: () =>
        status === 0 ||
        errorMessage.includes('Network Error') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('fetch'),
      result: {
        type: 'NETWORK_ERROR',
        message: TOKEN_REFRESH_ERRORS.NETWORK_ERROR,
      },
    },
  ];

  for (const rule of rules) {
    if (rule.match()) {
      return {
        ...rule.result,
        originalError: error,
      };
    }
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: TOKEN_REFRESH_ERRORS.UNKNOWN_ERROR,
    originalError: error,
  };
};

const getErrorMessage = (error: PossibleError): string => {
  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }
  if ('toString' in error && typeof error.toString === 'function') {
    return error.toString();
  }
  return '';
};

const getErrorStatus = (error: PossibleError): number | undefined => {
  if ('status' in error && typeof error.status === 'number') {
    return error.status;
  }
  return undefined;
};
