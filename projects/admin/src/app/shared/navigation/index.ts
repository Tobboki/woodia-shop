import { IMenuItem } from "../types/app.types";

// labels must be lowercase and match with the localization
// routes must be prefixed with (/) so it doesn't loop route
export default [
  {
    label: 'dashboard',
    icon: 'house',
    route: '/home',
  },
  {
    label: 'design',
    icon: 'box',
    route: '/designs',
  },
  {
    label: 'category',
    icon: 'layout-grid',
    route: '/category',
  },
] as IMenuItem[]