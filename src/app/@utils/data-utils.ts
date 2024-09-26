import { DropdownOption } from '@syn/models';

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
