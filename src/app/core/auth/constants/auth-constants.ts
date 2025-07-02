export const SIGN_IN_STEPS = {
  CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE:
    'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE' satisfies 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE',
};

export const AUTH_FLOW_TYPES: { CUSTOM_WITHOUT_SRP: 'CUSTOM_WITHOUT_SRP' } = {
  CUSTOM_WITHOUT_SRP: 'CUSTOM_WITHOUT_SRP',
};

export const TOKEN_REFRESH_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  EXPONENTIAL_BACKOFF_MULTIPLIER: 2,
  MAX_RETRY_DELAY_MS: 5000,
};

export const TOKEN_REFRESH_ERRORS = {
  NETWORK_ERROR: 'Network error during token refresh',
  REFRESH_TOKEN_EXPIRED: 'Refresh token has expired',
  UNAUTHORIZED: 'Unauthorized to refresh token',
  UNKNOWN_ERROR: 'Unknown error during token refresh',
  MAX_RETRIES_EXCEEDED: 'Maximum retry attempts exceeded for token refresh',
};
