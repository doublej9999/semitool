/** Marks data-layer user copy for extraction; runtime value stays the English msgid. */
export function msg<T extends string>(text: T): T {
  return text;
}
