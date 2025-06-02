import { DropdownOption } from 'src/app/legacy-admin/@models/dropdown-option';

export const getDropdownOptionsFromString = (
  options: string[],
  defaultSelection = false,
  prevOptions?: DropdownOption[]
): DropdownOption[] => {
  if (!options) {
    return [];
  }
  return options.map((aOption) => ({
    key: aOption,
    label: aOption,
    isSelected: prevOptions?.length
      ? prevOptions.find((prevOpt) => prevOpt.label === aOption).isSelected
      : defaultSelection,
  }));
};

export function getDefaultStartDate(daysAgo: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0] + 'T00:00:00Z';
}

export function getDefaultEndDate(): string {
  const date = new Date();
  return date.toISOString().split('T')[0] + 'T23:59:59Z';
}
