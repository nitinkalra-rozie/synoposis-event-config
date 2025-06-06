export interface SynMultiSelectOption<T> {
  label: string;
  value: T;
  children?: SynMultiSelectOption<T>[];
  elementClass?: string;
}
