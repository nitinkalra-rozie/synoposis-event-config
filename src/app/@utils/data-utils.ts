import { DropdownOption } from '@syn/models';

export const getDropdownOptionsFromString = (
  options: string[],
  defaultSelection = false
): DropdownOption[] => {
  if (!options) {
    return [];
  }
  return options.map((aOption) => ({
    key: aOption,
    label: aOption,
    isSelected: defaultSelection,
  }));
};
