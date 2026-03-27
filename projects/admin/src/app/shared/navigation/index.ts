import { IMenuItem } from "../types/app.types";

// labels must be lowercase and match with the localization
// routes must be prefixed with (/) so it doesn't loop route
export default [
  {
    label: 'dashboard',
    icon: 'lucideHouse',
    route: '/home',
  },
  {
    label: 'design',
    icon: 'lucideArmchair',
    route: '/designs',
  },
  {
    label: 'category',
    icon: 'lucideLayoutGrid',
    route: '/category',
  },
] as IMenuItem[]
