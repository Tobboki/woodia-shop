import { cva, VariantProps } from 'class-variance-authority';

export const logoVariants = cva('flex items-center justify-center', {
  variants: {
    wType: {
        default: '',
    },
    wText: {
      true: '',
    }
  },
  defaultVariants: {
    wType: 'default',
    wText: false,
  },
});

export type logoVariants = VariantProps<typeof logoVariants>;
