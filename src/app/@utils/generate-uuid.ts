export const getUUID = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    let uuid = v.toString(16);
    uuid = uuid.replace(/-/g, '');

    // Ensure the UUID starts with a letter to conform with CSS rules
    // Prefix with a letter if the first character is a number
    if (/^[0-9]/.test(uuid)) {
      uuid = `a${uuid}`; // Prefix with 'a' or any other letter
    }
    return uuid;
  });
