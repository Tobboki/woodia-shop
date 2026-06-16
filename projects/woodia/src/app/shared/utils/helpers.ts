import { TranslocoService } from "@jsverse/transloco";

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

export function localizeDimensionTitle(
  title: string,
  transloco: TranslocoService
): string {
  const match = title.match(/^(.+?)\s*-\s*(\d+)x(\d+)x(\d+)/);

  if (!match) {
    return title;
  }

  const [, category, width, height, depth] = match;

  const categoryKeyMap: Record<string, string> = {
    Bookcase: 'bookcase',
    Desk: 'desk',
    TvStand: 'tvStand',
    ShoeRack: 'shoeRack',
    BedsideTable: 'bedsideTable',

    'مكتبة': 'bookcase',
    'مكتب': 'desk',
    'وحدة تلفاز': 'tvStand',
    'خزانة أحذية': 'shoeRack',
    'طاولة جانبية': 'bedsideTable',
  };

  const key = categoryKeyMap[category.trim()];

  const translatedCategory = key
    ? transloco.translate(
      `sharedLib.designConfigurator.modelTypes.${key}`
    )
    : category;

  const unit = transloco.translate(
    'sharedLib.designConfigurator.cm'
  );

  return `${translatedCategory} - ${width}x${height}x${depth} ${unit}`;
}

export function getPostedTime(
  createdAt: string,
  lang: string
): string {
  if (!createdAt) return '';

  const locale = lang === 'ar' ? 'ar' : 'en';

  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: 'always',
  });

  const diffMs = new Date(createdAt).getTime() - Date.now();

  const mins = Math.round(diffMs / 60000);
  const hours = Math.round(diffMs / 3600000);
  const days = Math.round(diffMs / 86400000);

  if (Math.abs(mins) < 60) {
    return rtf.format(mins, 'minute');
  }

  if (Math.abs(hours) < 24) {
    return rtf.format(hours, 'hour');
  }

  if (Math.abs(days) < 7) {
    return rtf.format(days, 'day');
  }

  return new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-EG' : 'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  ).format(new Date(createdAt));
}

export function getPostedDate(
  dateStr: string,
  lang: string
): string {
  if (!dateStr) return '';

  return new Date(dateStr).toLocaleDateString(
    lang === 'ar' ? 'ar-EG' : 'en-US',
    {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }
  );
}