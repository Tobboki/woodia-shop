import { cva, VariantProps } from 'class-variance-authority';

export const inputGroupVariants = cva(
  'flex items-stretch w-full [&_input[z-input]]:!border-0 [&_input[z-input]]:!bg-transparent [&_input[z-input]]:!outline-none [&_input[z-input]]:!ring-0 [&_input[z-input]]:!ring-offset-0 [&_input[z-input]]:!px-0 [&_input[z-input]]:!py-0 [&_input[z-input]]:!h-full [&_input[z-input]]:flex-1 [&_textarea[z-input]]:!border-0 [&_textarea[z-input]]:!bg-transparent [&_textarea[z-input]]:!outline-none [&_textarea[z-input]]:!ring-0 [&_textarea[z-input]]:!ring-offset-0 [&_textarea[z-input]]:!px-0 [&_textarea[z-input]]:!py-0',
  {
    variants: {
      zSize: {
        default: 'h-fit',
        sm: 'h-9',
        lg: 'h-11',
      },
      zDisabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      zSize: 'default',
      zDisabled: false,
    },
  },
);

export const inputGroupAddonVariants = cva(
  'addon inline-flex items-center justify-center whitespace-nowrap text-sm font-medium border border-black/25 bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      zSize: {
        default: 'h-[48px] px-3 text-sm',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-4 text-base',
      },
      zPosition: {
        before: 'rounded-l-md border-r-0',
        after: 'rounded-r-md border-l-0',
      },
      zDisabled: {
        true: 'cursor-not-allowed opacity-50 pointer-events-none',
        false: '',
      },
      zBorderless: {
        true: 'border-0 shadow-none',
        false: '',
      },
    },
    defaultVariants: {
      zSize: 'default',
      zPosition: 'before',
      zDisabled: false,
      zBorderless: false,
    },
  },
);

export const inputGroupAffixVariants = cva('absolute inset-y-0 flex items-center text-muted-foreground pointer-events-none z-10', {
  variants: {
    zSize: {
      sm: 'text-xs',
      default: 'text-sm',
      lg: 'text-base',
    },
    zPosition: {
      prefix: 'left-0 pl-3',
      suffix: 'right-0 pr-3',
    },
  },
  defaultVariants: {
    zSize: 'default',
    zPosition: 'prefix',
  },
});

export const inputGroupInputVariants = cva(
  'flex w-full rounded-[8px] border font-normal border-black/25 bg-transparent font-placeholder file:border-0 file:text-foreground file:bg-transparent file:font-medium placeholder:text-black/50 disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-primary-200',
  {
    variants: {
      zSize: {
        default: 'h-[48px] px-[16px] py-[8px] max-sm:h-fit file:max-md:py-0',
        sm: 'h-[48px] px-[16px] py-[8px] file:max-md:py-0',
        lg: 'h-11 px-4 py-2 text-base',
      },
      zHasPrefix: {
        true: '',
        false: '',
      },
      zHasSuffix: {
        true: '',
        false: '',
      },
      zHasAddonBefore: {
        true: 'border-l-0 rounded-l-none',
        false: '',
      },
      zHasAddonAfter: {
        true: 'border-r-0 rounded-r-none',
        false: '',
      },
      zDisabled: {
        true: 'cursor-not-allowed opacity-50',
        false: '',
      },
      zStatus: {
        error: 'border-error-600 focus-visible:ring-error-600',
        warning: 'border-yellow-500 focus-visible:ring-yellow-500',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      zBorderless: {
        true: 'border-0 bg-transparent shadow-none',
        false: '',
      },
    },
    compoundVariants: [
      {
        zHasPrefix: true,
        zSize: 'sm',
        class: 'pl-7',
      },
      {
        zHasPrefix: true,
        zSize: 'default',
        class: 'pl-8',
      },
      {
        zHasPrefix: true,
        zSize: 'lg',
        class: 'pl-9',
      },
      {
        zHasSuffix: true,
        zSize: 'sm',
        class: 'pr-12',
      },
      {
        zHasSuffix: true,
        zSize: 'default',
        class: 'pr-14',
      },
      {
        zHasSuffix: true,
        zSize: 'lg',
        class: 'pr-16',
      },
    ],
    defaultVariants: {
      zSize: 'default',
      zHasPrefix: false,
      zHasSuffix: false,
      zHasAddonBefore: false,
      zHasAddonAfter: false,
      zDisabled: false,
      zBorderless: false,
    },
  },
);

export type ZardInputGroupVariants = VariantProps<typeof inputGroupVariants>;
