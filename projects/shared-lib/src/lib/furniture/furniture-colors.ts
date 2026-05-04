/** Represents a named furniture color with its hex value. */
export interface FurnitureColor {
  name: string
  value: string
}

/** Palette of available furniture colors used across the configurator. */
export const FURNITURE_COLORS: readonly FurnitureColor[] = [
  { name: 'Steel Blue', value: '#aec6de' },
  { name: 'Deep Slate', value: '#3c506a' },
  { name: 'Lavender Mist', value: '#eae8f3' },
  { name: 'Antique White', value: '#f6efdd' },
  { name: 'Soft Gold', value: '#feefc4' },
  { name: 'Light Grey', value: '#d4d4d4' },
  { name: 'Burnt Siena', value: '#b45c46' },
  { name: 'Soft Pink', value: '#ffc5d1' },
  { name: 'Sand', value: '#d4cfc9' },
  { name: 'Mint', value: '#dde8e2' },
  { name: 'Charcoal', value: '#474749' },
  { name: 'Olive', value: '#6d7f4f' },
] as const
