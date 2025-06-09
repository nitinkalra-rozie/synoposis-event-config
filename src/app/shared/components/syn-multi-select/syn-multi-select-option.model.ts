export interface SynMultiSelectOption<T> {
  label: string;
  value: T;
  children?: SynMultiSelectOption<T>[];
  elementClass?: string;
}

export interface SynMultiSelectConfig {
  applyFilterButtonText?: string;
  labelSearch?: string;
  labelPosition?: 'before' | 'after';
}
