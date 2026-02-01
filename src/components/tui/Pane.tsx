import React from 'react';
import { Box, Text } from 'ink';

/**
 * Props for the Pane component
 */
interface PaneProps {
  /** Child components to render inside the pane */
  children: React.ReactNode;
  /** Whether this pane currently has focus */
  isFocused: boolean;
  /** Optional title for the pane header */
  title?: string;
  /** Width of the pane (number of columns) */
  width: number;
  /** Height of the pane (number of rows, including border) */
  height: number;
}

/**
 * Wrapper component for a pane with border and focus state
 *
 * Displays a bordered container with visual focus indicators.
 * Shows dimmed border when unfocused, highlighted border when focused.
 */
export function Pane({ children, isFocused, title, width, height }: PaneProps): React.ReactElement {
  // Enhanced styling for better visibility
  const borderColor = isFocused ? 'cyan' : 'gray';
  const borderStyle = 'round'; // Consistent border style for cleaner look
  const titleColor = isFocused ? 'cyan' : 'white';
  const titleBold = isFocused;

  // Calculate content dimensions (excluding border)
  const contentWidth = Math.max(0, width - 2); // 2 for left/right border
  const contentHeight = Math.max(0, height - 2); // 2 for top/bottom border
  const titleHeight = title ? 1 : 0;
  const innerHeight = Math.max(0, contentHeight - titleHeight);

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle={borderStyle}
      borderColor={borderColor}
    >
      {title && (
        <Box>
          <Text
            bold={titleBold}
            color={titleColor}
            backgroundColor={isFocused ? 'blue' : undefined}
          >
            {isFocused ? ` ${title} ` : title}
          </Text>
        </Box>
      )}
      <Box flexDirection="column" width={contentWidth} height={innerHeight}>
        {children}
      </Box>
    </Box>
  );
}
