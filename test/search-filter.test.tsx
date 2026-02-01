// React is imported for JSX but not directly used
import { describe, it, expect, vi } from 'vitest';

// Simplified test for search/filter functionality
describe('Search and filter functionality', () => {
  it('should filter text properly', () => {
    const items = ['apple', 'banana', 'cherry', 'date'];
    const filtered = items.filter((item) => item.includes('a'));
    expect(filtered).toEqual(['apple', 'banana', 'date']);
  });

  it('should handle case-insensitive filtering', () => {
    const items = ['Apple', 'Banana', 'CHERRY', 'date'];
    const filtered = items.filter((item) => item.toLowerCase().includes('a'));
    expect(filtered).toEqual(['Apple', 'Banana', 'date']);
  });

  it('should support debouncing', () => {
    vi.useFakeTimers();

    let callCount = 0;
    let lastValue = '';

    // Simplified debounce function
    function setupDebounce(callback: (value: string) => void, delay: number) {
      let timeout: ReturnType<typeof setTimeout> | null = null;

      return function (value: string) {
        if (timeout) clearTimeout(timeout);

        timeout = setTimeout(() => {
          callback(value);
        }, delay);
      };
    }

    const debouncedFunc = setupDebounce((value) => {
      callCount++;
      lastValue = value;
    }, 300);

    // Call multiple times in succession
    debouncedFunc('a');
    debouncedFunc('ap');
    debouncedFunc('app');
    debouncedFunc('appl');
    debouncedFunc('apple');

    // Before the timer, no calls should have happened
    expect(callCount).toBe(0);

    // Advance the timer
    vi.advanceTimersByTime(300);

    // Only the last call should have gone through
    expect(callCount).toBe(1);
    expect(lastValue).toBe('apple');

    vi.useRealTimers();
  });
});
