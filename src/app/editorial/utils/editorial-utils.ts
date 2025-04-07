export function convertDate(dateString: string): string {
  const parsedDate = new Date(dateString.replace(' ', 'T'));
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Intl.DateTimeFormat('en-US', options).format(parsedDate);
}
