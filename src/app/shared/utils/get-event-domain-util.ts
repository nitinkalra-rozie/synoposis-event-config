export const getEventDomain = (): string => {
  const hostname = window.location.hostname;
  let domain =
    hostname === 'localhost' ? 'dev-sbx.synopsis.rozie.ai' : hostname;
  domain = domain.replace('admin.', '');
  return domain;
};
