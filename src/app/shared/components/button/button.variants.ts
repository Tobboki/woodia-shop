import { cva, VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[] font-button font-medium transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      zType: {
        default: 'bg-primary-300 text-white shadow-button hover:bg-primary-300/90',
        destructive: 'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline: 'border border-primary-100 font-button text-primary-300 shadow-button hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground shadow-button hover:bg-secondary/80',
        ghost: 'hover:bg-primary-50 dark:hover:bg-accent/50',
        link: 'font-body text-primary-300 underline-offset-4 hover:underline',
        icon: ''
      },
      zSize: {
        default: 'h-fit px-[24px] py-[12px] has-[>svg]:px-[24px]',
        sm: 'h-8 rounded-md gap-1.5 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        link: '',
        icon: 'size-9',
      },
      zShape: {
        default: 'rounded-[8px]',
        circle: 'rounded-full',
        square: 'rounded-none',
      },
      zFull: {
        true: 'w-full',
      },
      zLoading: {
        true: 'opacity-50 pointer-events-none',
      },
      zPosition: {
        default: 'justify-center',
        left: 'justify-start',
        right: 'justify-end',
      }
    },
    defaultVariants: {
      zType: 'default',
      zSize: 'default',
      zShape: 'default',
    },
  },
);
export type ZardButtonVariants = VariantProps<typeof buttonVariants>;
