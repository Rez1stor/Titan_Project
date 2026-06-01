export type AvatarChoice = {
  type: 'emoji' | 'image';
  value: string;
};

export const avatarOptions = ['🍺', '🍷', '🥂', '🍾', '🍸', '🫗', '🌿', '⭐', '🍻', '🍹', '🍑', '🍒'];

export const AVATAR_STORAGE_PREFIX = 'titan-profile-avatar:';

export function pickAvatar(username: string) {
  const normalized = username.trim().toLowerCase();
  let hash = 0;

  for (const character of normalized) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return avatarOptions[hash % avatarOptions.length];
}

export function getAvatarStorageKey(userId?: number | null) {
  return `${AVATAR_STORAGE_PREFIX}${userId ?? 'guest'}`;
}
