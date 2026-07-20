// Deriva um acento estável (teal/gold) a partir de um id — dá a cada projeto
// uma "cor de lombada" consistente entre a sidebar e os cards do dashboard.
export function accentFor(id: string): "teal" | "gold" {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum % 2 === 0 ? "teal" : "gold";
}
