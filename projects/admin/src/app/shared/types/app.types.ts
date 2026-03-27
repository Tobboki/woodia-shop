import {IconType} from '@ng-icons/core';

export interface IMenuItem {
  label: string;
  route?: string
  icon?: IconType;
  submenu?: IMenuItem[];
}

export interface ISidebarGroup {
  title?: string
  menu: IMenuItem[]
}

export type TModules = 'design' | 'category'
