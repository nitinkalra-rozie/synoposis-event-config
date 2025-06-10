export interface SynMenuMultiSelectOption<T> {
  label: string;
  value: T;
  children?: SynMenuMultiSelectOption<T>[];
  elementClass?: string;
}
