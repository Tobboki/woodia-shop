import { cva, VariantProps } from 'class-variance-authority';

export const logoVariants = cva('flex items-center justify-center', {
  variants: {
    zType: {
        default: 'bg-primary-300 font-button text-white shadow-button hover:bg-primary-300/90 rounded-button',
      },
  },
  defaultVariants: {
    zType: 'default',
  },
});

export type logoVariants = VariantProps<typeof logoVariants>;
