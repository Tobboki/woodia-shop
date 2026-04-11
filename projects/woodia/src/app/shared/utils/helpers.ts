export function getTextDir(text: string): 'rtl' | 'ltr' {
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/; // Hebrew, Arabic, etc.
  return rtlChars.test(text) ? 'rtl' : 'ltr';
}

export function isImage(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const cleanUrl = url.split('?')[0].toLowerCase();

    return (
      cleanUrl.endsWith('.png') ||
      cleanUrl.endsWith('.jpg') ||
      cleanUrl.endsWith('.jpeg') ||
      cleanUrl.endsWith('.webp') ||
      cleanUrl.endsWith('.gif')
    );
  } catch {
    return false;
  }
}
