function skillNeedles(skillName: string): string[] {
  const lower = skillName.toLowerCase();
  const needles = new Set<string>([lower]);
  needles.add(lower.replace(/\.js$/u, ''));
  needles.add(lower.replace(/\s+/gu, ''));
  return [...needles].filter((needle) => needle.length > 0);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export function haystackHasSkill(haystack: string, skillName: string): boolean {
  return skillNeedles(skillName).some((needle) => {
    const pattern = new RegExp(`(?:^|[^a-z0-9+#])${escapeRegex(needle)}(?:$|[^a-z0-9+#])`, 'i');
    return pattern.test(haystack);
  });
}
