import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold" | "link";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-950 text-ivory shadow-sm hover:bg-brand-900 hover:shadow-md focus-visible:outline-brand-950 disabled:bg-brand-950/50",
  secondary:
    "bg-gold-500 text-ink shadow-sm hover:bg-gold-400 hover:shadow-md focus-visible:outline-gold-600 disabled:bg-gold-500/50",
  outline:
    "border border-brand-950/20 bg-white/70 text-brand-950 hover:border-brand-950/40 hover:bg-white hover:shadow-sm focus-visible:outline-brand-950",
  ghost: "text-brand-950 hover:bg-brand-950/5 focus-visible:outline-brand-950",
  danger: "bg-red-700 text-white shadow-sm hover:bg-red-800 hover:shadow-md focus-visible:outline-red-800 disabled:bg-red-700/50",
  gold: "border border-gold-600/40 bg-gold-50 text-gold-800 hover:bg-gold-100 hover:shadow-sm focus-visible:outline-gold-600",
  link: "text-brand-800 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-brand-950"
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
  icon: "h-10 w-10 p-0"
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-[background-color,box-shadow,transform,border-color,color] duration-200 ease-premium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70",
    variants[variant],
    sizes[size],
    className
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
