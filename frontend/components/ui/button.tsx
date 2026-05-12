import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.7)] hover:brightness-110 active:brightness-95",
        secondary:
          "bg-muted text-foreground border border-border hover:bg-muted/70",
        outline:
          "border border-border bg-transparent hover:bg-muted/40 text-foreground",
        ghost: "hover:bg-muted/60 text-foreground",
        gradient:
          "text-white shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.7)] hover:brightness-110 bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))]",
        destructive:
          "bg-danger text-white hover:brightness-110",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { buttonVariants };
