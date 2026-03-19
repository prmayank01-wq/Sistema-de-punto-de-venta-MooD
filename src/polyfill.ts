// Fix for html2canvas trying to override window.fetch in an environment where it only has a getter
if (typeof window !== 'undefined' && window.fetch) {
  try {
    Object.defineProperty(window, 'fetch', {
      value: window.fetch,
      writable: true,
      configurable: true
    });
  } catch (e) {
    console.warn('Could not make window.fetch writable', e);
  }
}
