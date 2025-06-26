export interface SynSingleSelectOption<T> {
  label: string;
  value: T;
  children?: SynSingleSelectOption<T>[];
  elementClass?: string;
}
