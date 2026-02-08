/**
 * Text utility functions for recipe content formatting
 */

/**
 * Splits text by newlines and removes trailing empty lines.
 * Useful for preventing extra spacing at the end of sections.
 *
 * @example
 * splitLines("line1\nline2\n\n") // ["line1", "line2"]
 */
export function splitLines(text: string): string[] {
  return text.trimEnd().split('\n');
}

/**
 * Checks if a string is empty or contains only whitespace.
 *
 * @example
 * isEmpty("   ") // true
 * isEmpty("text") // false
 */
export function isEmpty(text: string | null | undefined): boolean {
  return text == null || text.trim() === '';
}

/**
 * Checks if a string has content (not empty or whitespace-only).
 *
 * @example
 * hasContent("  text  ") // true
 * hasContent("   ") // false
 */
export function hasContent(text: string | null | undefined): boolean {
  return !isEmpty(text);
}

/**
 * Normalizes whitespace in text by:
 * - Trimming leading/trailing whitespace
 * - Collapsing multiple consecutive empty lines to single empty line
 * - Preserving intentional single empty lines
 *
 * @example
 * normalizeWhitespace("line1\n\n\nline2") // "line1\n\nline2"
 */
export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\n{3,}/g, '\n\n'); // Replace 3+ newlines with 2
}

/**
 * Splits text into lines, filtering out completely empty lines at start/end
 * but preserving empty lines in the middle for formatting.
 *
 * @example
 * splitLinesPreservingInternal("  \nline1\n\nline2\n  ")
 * // ["line1", "", "line2"]
 */
export function splitLinesPreservingInternal(text: string): string[] {
  const lines = text.split('\n');

  // Find first and last non-empty line
  let start = 0;
  let end = lines.length - 1;

  while (start < lines.length && lines[start].trim() === '') {
    start++;
  }

  while (end >= 0 && lines[end].trim() === '') {
    end--;
  }

  return lines.slice(start, end + 1);
}

/**
 * Checks if a line is a section header (ends with colon).
 */
export function isSectionHeader(line: string): boolean {
  return line.trim().endsWith(':');
}
