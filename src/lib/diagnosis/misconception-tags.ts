const SYSTEM_MISCONCEPTION_TAGS = new Set(['추가 풀이 정보 필요']);

export function isSystemMisconceptionTag(tag: string) {
  return SYSTEM_MISCONCEPTION_TAGS.has(tag.trim());
}

export function filterVisibleMisconceptionTags(tags: string[]) {
  return tags.filter((tag) => !isSystemMisconceptionTag(tag));
}
