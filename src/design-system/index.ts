/**
 * Elkys Design System
 * Barrel export for all design system components.
 */

// --- Utils ---
export { cn } from "./utils/cn";

// --- Components ---
export { Button, buttonVariants } from "./components/Button";
export type { ButtonProps } from "./components/Button";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/Card";

export { Input } from "./components/Input";
export { Textarea } from "./components/Textarea";
export { Toaster } from "./components/Toast";

export { AlertDialog } from "./components/AlertDialog";

export { HexPattern } from "./components/HexPattern";
export type { HexPatternProps } from "./components/HexPattern";

export { HexAvatar } from "./components/HexAvatar";
export type { HexAvatarProps } from "./components/HexAvatar";

// --- Primitives ---
export { Container } from "./primitives/Container";
export type { ContainerProps } from "./primitives/Container";

export { Section } from "./primitives/Section";
export type { SectionProps } from "./primitives/Section";

export { Stack } from "./primitives/Stack";
export type { StackProps } from "./primitives/Stack";

export { Grid } from "./primitives/Grid";
export type { GridProps } from "./primitives/Grid";

// --- Form ---
export { Label } from "./form/Label";
export type { LabelProps } from "./form/Label";

export { Field } from "./form/Field";
export type { FieldProps } from "./form/Field";

export { ErrorText } from "./form/ErrorText";
export type { ErrorTextProps } from "./form/ErrorText";
