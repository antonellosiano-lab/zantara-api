export function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>"'&]/g, '');
}
