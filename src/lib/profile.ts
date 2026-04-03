import type { CSSProperties } from "react";

export const PORTAL_PROFILE_UPDATED_EVENT = "elkys:profile-updated";

export interface ProfileAvatarTransform {
  zoom: number;
  positionX: number;
  positionY: number;
}

export const DEFAULT_PROFILE_AVATAR_TRANSFORM: ProfileAvatarTransform = {
  zoom: 1.15,
  positionX: 50,
  positionY: 50,
};

export interface PortalProfileUpdatedDetail {
  fullName?: string;
  avatarUrl?: string | null;
  avatarTransform?: ProfileAvatarTransform;
}

export function emitPortalProfileUpdated(detail: PortalProfileUpdatedDetail) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<PortalProfileUpdatedDetail>(PORTAL_PROFILE_UPDATED_EVENT, { detail })
  );
}

export function getProfileInitials(value: string | null | undefined, fallback = "E") {
  const normalized = value?.trim();
  if (!normalized) return fallback;

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, numericValue));
}

export function resolveProfileAvatarTransform(
  value?: Partial<ProfileAvatarTransform> | null
): ProfileAvatarTransform {
  return {
    zoom: Number(
      clampNumber(value?.zoom, 1, 2.4, DEFAULT_PROFILE_AVATAR_TRANSFORM.zoom).toFixed(2)
    ),
    positionX: Math.round(
      clampNumber(value?.positionX, 0, 100, DEFAULT_PROFILE_AVATAR_TRANSFORM.positionX)
    ),
    positionY: Math.round(
      clampNumber(value?.positionY, 0, 100, DEFAULT_PROFILE_AVATAR_TRANSFORM.positionY)
    ),
  };
}

export function areAvatarTransformsEqual(
  first: ProfileAvatarTransform,
  second: ProfileAvatarTransform
) {
  return (
    first.zoom === second.zoom &&
    first.positionX === second.positionX &&
    first.positionY === second.positionY
  );
}

export function isProfileAvatarTransformColumnError(message?: string | null) {
  const normalized = (message ?? "").toLowerCase();

  return (
    normalized.includes("avatar_zoom") ||
    normalized.includes("avatar_position_x") ||
    normalized.includes("avatar_position_y")
  );
}

export function getProfileAvatarImageStyle(transform: ProfileAvatarTransform): CSSProperties {
  const panRange = Math.min(40, Math.max(0, (transform.zoom - 1) * 80));
  const translateX = Number((((transform.positionX - 50) / 50) * panRange).toFixed(2));
  const translateY = Number((((transform.positionY - 50) / 50) * panRange).toFixed(2));

  return {
    objectPosition: "center",
    transform: `translate3d(${translateX}%, ${translateY}%, 0) scale(${transform.zoom})`,
    transformOrigin: "center",
    willChange: "transform",
  };
}
