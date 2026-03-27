import { cva, type VariantProps } from 'class-variance-authority';

export const toastVariants = cva('group toast group-[.toaster]:bg-background group-[.toaster]:font-caption group-[.toaster]:border-2 group-[.toaster]:shadow-lg', {
  variants: {
    variant: {
      default: 'group-[.toaster]:bg-background group-[.toaster]:text-foreground',
      destructive: 'group-[.toaster]:bg-error-400 group-[.toaster]:text-destructive-foreground destructive group-[.toaster]:border-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type ZardToastVariants = VariantProps<typeof toastVariants>;
