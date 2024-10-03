export const getInsightsDomainUrl = (): string => {
  const hostname = window.location.hostname.replace('admin.', '');
  const protocol = window.location.protocol;
  let port = window.location.port;
  let domainName = `${protocol}//${hostname}`;
  if (port && port !== '80' && port !== '443') {
    if (port === '4201') {
      port = '4200';
    }
    domainName += `:${port}`;
  }
  return domainName;
};
