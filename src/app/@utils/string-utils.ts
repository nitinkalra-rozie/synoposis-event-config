export const replaceDashAndSpacesWithUnderscore = (text: string): string => {
  if (!text) {
    return '';
  }
  return text.replace(/[-\s]/g, '_').toLowerCase().trim();
};
