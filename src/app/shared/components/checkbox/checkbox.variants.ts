import { cva, VariantProps } from 'class-variance-authority';

export const checkboxVariants = cva(
  'cursor-[unset] peer appearance-none border transition shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      zType: {
        default: 'border-black/25 checked:bg-primary-300',
        destructive: 'border-destructive checked:bg-destructive',
      },
      zSize: {
        default: 'h-[24px] w-[24px]',
        lg: 'h-6 w-6',
      },
      zShape: {
        default: 'rounded-[4px]',
        circle: 'rounded-full',
        square: 'rounded-none',
      },
    },
    defaultVariants: {
      zType: 'default',
      zSize: 'default',
      zShape: 'default',
    },
  },
);

export const checkboxLabelVariants = cva('cursor-[unset] text-current empty:hidden', {
  variants: {
    zSize: {
      default: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    zSize: 'default',
  },
});

export type ZardCheckboxVariants = VariantProps<typeof checkboxVariants>;
export type ZardCheckLabelVariants = VariantProps<typeof checkboxLabelVariants>;
