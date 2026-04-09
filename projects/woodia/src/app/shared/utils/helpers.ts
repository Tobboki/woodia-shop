export function getTextDir(text: string): 'rtl' | 'ltr' {
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/; // Hebrew, Arabic, etc.
  return rtlChars.test(text) ? 'rtl' : 'ltr';
}
