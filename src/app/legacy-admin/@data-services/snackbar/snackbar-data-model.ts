export interface SnackbarData {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  action?: string;
}
