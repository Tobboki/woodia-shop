
export interface IMenuItem {
  id: string
  label: string;
  path?: string;
  icon?: string;
  children?: IMenuItem[];
}