export type TLayoutVariant = 'default' | 'plain';

export type TMenuKey = 'landing' | 'customer' | 'maker';

export type TTableDensity = 'default' | 'compact' | 'comfortable'

export type TThemeMode = 'system' | 'light' | 'dark'

export interface IMenuItem {
  id: string
  label: string;
  path?: string;
  icon?: string;
  children?: IMenuItem[];
}
