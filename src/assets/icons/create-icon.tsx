import {
  forwardRef,
  type SVGProps,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Width and height in pixels (default: 24) */
  size?: number | string;
  /** SVG stroke width (default: 2) */
  strokeWidth?: number | string;
  /** Accessible title — when provided, sets role="img" and aria-label */
  title?: string;
  className?: string;
}

type SvgComponent = ForwardRefExoticComponent<
  SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>
>;

/**
 * createIcon — Wraps a raw SVGR component with standardized props and a11y defaults.
 *
 * - Default: aria-hidden="true" (decorative)
 * - If `title` or `aria-label` is passed: aria-hidden=false, role="img"
 * - Always: focusable="false"
 */
export function createIcon(SvgComponent: SvgComponent, displayName: string) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(
    ({ size = 24, strokeWidth = 2, title, className, "aria-label": ariaLabel, ...rest }, ref) => {
      const isAccessible = !!(title || ariaLabel);

      return (
        <SvgComponent
          ref={ref}
          width={size}
          height={size}
          strokeWidth={strokeWidth}
          className={className}
          focusable="false"
          aria-hidden={isAccessible ? undefined : true}
          aria-label={isAccessible ? (ariaLabel ?? title) : undefined}
          role={isAccessible ? "img" : undefined}
          {...rest}
        />
      );
    }
  );

  Icon.displayName = displayName;
  return Icon;
}
