import { describe, it, expect } from 'vitest';
import { getVisibleItems, getVisibleLines } from '../src/hooks/useScrollable';

describe('getVisibleItems utility', () => {
  const items = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);

  it('returns correct slice of items', () => {
    const visibleItems = getVisibleItems(items, 5, 10);

    expect(visibleItems.length).toBe(10);
    expect(visibleItems[0]).toBe('Item 6'); // 0-indexed, so scrollOffset 5 means Item 6
    expect(visibleItems[9]).toBe('Item 15');
  });

  it('handles edge cases', () => {
    // Near the end of the list
    const endItems = getVisibleItems(items, 95, 10);

    expect(endItems.length).toBe(5); // Only 5 items left
    expect(endItems[0]).toBe('Item 96');
    expect(endItems[4]).toBe('Item 100');

    // Empty list
    const emptyItems = getVisibleItems([], 0, 10);
    expect(emptyItems.length).toBe(0);
  });
});

describe('getVisibleLines utility', () => {
  const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);

  it('returns correct slice of lines', () => {
    const visibleLines = getVisibleLines(lines, 5, 10);

    expect(visibleLines.length).toBe(10);
    expect(visibleLines[0]).toBe('Line 6');
    expect(visibleLines[9]).toBe('Line 15');
  });
});
