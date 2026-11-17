import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[15px] font-semibold cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#2563EB] text-white shadow-xs hover:bg-[#1D4ED8] active:bg-[#1E40AF]",
        destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#111318] text-[#111827] dark:text-[#FAFAFA] shadow-xs hover:bg-[#F7F8FA] dark:hover:bg-[#181B22] hover:border-[#D1D5DB] dark:hover:border-[#3F3F46]",
        secondary: "bg-[#F7F8FA] dark:bg-[#181B22] text-[#111827] dark:text-[#FAFAFA] border border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#E5E7EB]/70 dark:hover:bg-[#20242D]",
        ghost: "hover:bg-[#F7F8FA] dark:hover:bg-[#181B22] hover:text-[#111827] dark:hover:text-[#FAFAFA]",
        link: "text-[#2563EB] dark:text-[#3B82F6] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-md px-3.5 text-[13px] font-medium",
        lg: "h-12 rounded-lg px-8 text-[16px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
