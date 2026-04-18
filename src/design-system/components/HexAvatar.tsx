import * as React from "react";

import { cn } from "@/design-system/utils/cn";
// Import via src/assets pra Vite aplicar fingerprint hash (cache-bust automatico).
import hexagonalBg from "@/assets/icons/hexagonal.webp";

const sizeStyles = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
  hero: "h-36 w-36 md:h-44 md:w-44",
} as const;

const insetStyles = {
  sm: "inset-[10%]",
  md: "inset-[9%]",
  lg: "inset-[8.5%]",
  xl: "inset-[8%]",
  hero: "inset-[7.5%]",
} as const;

const textStyles = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
  xl: "text-3xl",
  hero: "text-4xl md:text-5xl",
} as const;

export interface HexAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback: string;
  size?: keyof typeof sizeStyles;
  backgroundClassName?: string;
  contentInsetClassName?: string;
  imageClassName?: string;
  imageStyle?: React.CSSProperties;
}

const hexMaskStyle = {
  WebkitMaskImage: `url(${hexagonalBg})`,
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  WebkitMaskSize: "contain",
  maskImage: `url(${hexagonalBg})`,
  maskRepeat: "no-repeat",
  maskPosition: "center",
  maskSize: "contain",
} as const;

const HexAvatar = React.forwardRef<HTMLDivElement, HexAvatarProps>(
  (
    {
      src,
      alt = "",
      fallback,
      size = "md",
      className,
      backgroundClassName,
      contentInsetClassName,
      imageClassName,
      imageStyle,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "relative isolate inline-flex shrink-0 select-none drop-shadow-[0_14px_24px_hsl(var(--elk-primary)/0.12)] dark:drop-shadow-[0_16px_26px_hsl(var(--elk-primary)/0.24)]",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <img
        src={hexagonalBg}
        alt=""
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full object-contain",
          backgroundClassName
        )}
      />

      <div
        className={cn(
          "absolute overflow-hidden bg-primary-soft",
          insetStyles[size],
          contentInsetClassName
        )}
        style={hexMaskStyle}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className={cn("h-full w-full object-cover", imageClassName)}
            style={imageStyle}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-primary font-semibold tracking-tight text-white",
              textStyles[size]
            )}
          >
            {fallback}
          </div>
        )}
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "absolute border border-white/15 dark:border-white/10",
          insetStyles[size],
          contentInsetClassName
        )}
        style={hexMaskStyle}
      />
    </div>
  )
);

HexAvatar.displayName = "HexAvatar";

export { HexAvatar };
