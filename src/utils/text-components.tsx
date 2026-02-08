/**
 * React/Ink-specific text rendering utilities
 */

import React from 'react';
import { Text, Transform } from 'ink';

/**
 * Parse markdown formatting and return Text elements with proper styling.
 * Supports inline **bold** sections within text.
 *
 * @example
 * parseMarkdownText("Mix the **dry ingredients** together")
 * // Returns: <>Mix the <Text bold>dry ingredients</Text> together</>
 */
export function parseMarkdownText(text: string): React.JSX.Element {
  const parts: React.JSX.Element[] = [];
  let currentIndex = 0;
  let key = 0;

  // Regex to find **bold** sections
  const boldRegex = /\*\*(.+?)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the bold section
    if (match.index > currentIndex) {
      parts.push(<Text key={key++}>{text.slice(currentIndex, match.index)}</Text>);
    }

    // Add the bold text (without the ** markers)
    parts.push(
      <Text key={key++} bold>
        {match[1]}
      </Text>
    );

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(<Text key={key++}>{text.slice(currentIndex)}</Text>);
  }

  return parts.length > 0 ? <>{parts}</> : <Text>{text}</Text>;
}

/**
 * Component that trims leading whitespace from rendered text content.
 * Useful for cleaning up text that may have inconsistent indentation.
 *
 * @example
 * <TrimLeadingWhitespace>
 *   <Text>  Some indented text</Text>
 * </TrimLeadingWhitespace>
 * // Renders: "Some indented text"
 */
export function TrimLeadingWhitespace({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return <Transform transform={(content) => content.trimStart()}>{children}</Transform>;
}
