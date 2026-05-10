/** Default matches backend `MAX_UPLOAD_BYTES` when unset (see `app/core/config.py`). */
export const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

export function formatMaxAvatarSize(): string {
  return `${Math.round(MAX_AVATAR_BYTES / (1024 * 1024))} MB`;
}
