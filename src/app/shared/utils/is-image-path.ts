export function isImagePath(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;

  const cleanUrl = value.split('?')[0].split('#')[0];

  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'];

  const extension = cleanUrl.split('.').pop()?.toLowerCase();

  return !!extension && imageExtensions.includes(extension);
}