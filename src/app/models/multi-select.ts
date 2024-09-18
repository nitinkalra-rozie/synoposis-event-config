export interface MultiSelectOption {
  key: string;
  label: string;
  isSelected?: boolean;
  metadata?: Record<string, any>; // if you want to pass the whole option, use this
}
