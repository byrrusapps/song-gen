export function formatContent(text: string): string {
  return text
    // Bold + Italic (must come before bold and italic individually)
    .replace(/\*_(.+?)_\*/g, '<span class="bold-italic">$1</span>')
    .replace(/_\*(.+?)\*_/g, '<span class="bold-italic">$1</span>')
    // Monospace (triple backticks first, before single)
    .replace(/```(.+?)```/gs, '<span class="monospace">$1</span>')
    // Bold
    .replace(/\*(.+?)\*/g, '<span class="bold">$1</span>')
    // Italic
    .replace(/_(.+?)_/g, '<span class="italic">$1</span>')
    // Strikethrough
    .replace(/~(.+?)~/g, '<span class="strikethrough">$1</span>');
}