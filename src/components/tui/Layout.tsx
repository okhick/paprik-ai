import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useStdout } from 'ink';
import { useAppState, useAppActions } from './AppContext.js';
import { Pane } from './Pane.js';

/**
 * Minimum supported terminal dimensions
 */
const MIN_WIDTH = 80;
const MIN_HEIGHT = 24;

/**
 * Props for Layout component
 */
interface LayoutProps {
  /** Left pane content (recipe list) */
  leftPane: React.ReactNode;
  /** Right pane content (recipe detail) */
  rightPane: React.ReactNode;
}

/**
 * Two-pane layout container with focus management
 *
 * Features:
 * - 40/60 split layout between left and right panes
 * - Terminal dimension detection with useStdout
 * - Minimum terminal size enforcement (80x24)
 * - Automatic resize handling
 * - Visual focus indicators
 * - Global keyboard navigation (Tab, Shift+Tab, Left/Right arrows)
 */
export function Layout({ leftPane, rightPane }: LayoutProps): React.ReactElement {
  const { stdout } = useStdout();
  const state = useAppState();
  const actions = useAppActions();

  const { activePaneId, showHelp, isSearchActive, searchQuery } = state;
  const { setActivePaneId, toggleHelp, setSearchQuery, setIsSearchActive } = actions;

  // Get terminal dimensions
  const terminalWidth = stdout?.columns || MIN_WIDTH;
  const terminalHeight = stdout?.rows || MIN_HEIGHT;

  // Check if terminal meets minimum size
  const isTooSmall = terminalWidth < MIN_WIDTH || terminalHeight < MIN_HEIGHT;

  // Calculate pane dimensions (40/60 split)
  const leftPaneWidth = Math.floor(terminalWidth * 0.4);
  const rightPaneWidth = terminalWidth - leftPaneWidth;

  // Reserve 1 row for status bar at the bottom
  const statusBarHeight = 2;
  const paneHeight = terminalHeight - statusBarHeight;

  // Global keyboard shortcuts
  useInput(
    (input, key) => {
      // Quit with Ctrl+C
      if (key.ctrl && input === 'c') {
        process.exit(0);
      }

      // Help overlay
      if (input === '?') {
        toggleHelp();
        return;
      }

      // Close help with Escape
      if (showHelp && key.escape) {
        toggleHelp();
        return;
      }

      // Don't process other keys when help is showing
      if (showHelp) {
        return;
      }

      // Search mode active - handle text input
      if (isSearchActive) {
        // Escape: deactivate search (keep query)
        if (key.escape) {
          setIsSearchActive(false);
          return;
        }

        // Backspace: delete last character
        if (key.backspace || key.delete) {
          setSearchQuery(searchQuery.slice(0, -1));
          return;
        }

        // Regular character input
        if (input && !key.ctrl && !key.meta) {
          setSearchQuery(searchQuery + input);
          return;
        }

        // Don't process other navigation keys in search mode
        return;
      }

      // Quit with 'q' (only when not in search mode)
      if (input === 'q') {
        process.exit(0);
      }

      // Activate search with '/' (when list pane focused)
      if (input === '/' && activePaneId === 'list') {
        setIsSearchActive(true);
        return;
      }

      // Escape: clear search if there's a query
      if (key.escape && searchQuery) {
        setSearchQuery('');
        return;
      }

      // Tab: cycle focus forward
      if (key.tab && !key.shift) {
        setActivePaneId(activePaneId === 'list' ? 'detail' : 'list');
        return;
      }

      // Shift+Tab: cycle focus backward
      if (key.tab && key.shift) {
        setActivePaneId(activePaneId === 'detail' ? 'list' : 'detail');
        return;
      }

      // Left arrow: focus left pane (only when not navigating lists)
      if (key.leftArrow && activePaneId !== 'list') {
        setActivePaneId('list');
        return;
      }

      // Right arrow: focus right pane (only when not navigating lists)
      if (key.rightArrow && activePaneId !== 'detail') {
        setActivePaneId('detail');
        return;
      }

      // Note: Up/Down, Page Up/Down, Home/End navigation for list and detail panes
      // will be handled by the RecipeListPane and RecipeDetailPane components themselves
      // as they need access to scroll state and selection state
    },
    { isActive: true }
  );

  // Handle terminal resize: terminal dimensions automatically update via useStdout
  // No additional handling needed - React will re-render with new dimensions

  if (isTooSmall) {
    return <TooSmallBox width={terminalHeight} height={terminalWidth} />;
  }
  if (showHelp) {
    return <HelpBox width={terminalWidth} height={terminalHeight} />;
  }

  // Render two-pane layout
  return (
    <Box width={terminalWidth} height={terminalHeight} flexDirection="column">
      <Box width={terminalWidth} height={paneHeight}>
        {/* Left pane (Recipe List) */}
        <Pane isFocused={activePaneId === 'list'} width={leftPaneWidth} height={paneHeight}>
          {leftPane}
        </Pane>

        {/* Right pane (Recipe Detail) */}
        <Pane isFocused={activePaneId === 'detail'} width={rightPaneWidth} height={paneHeight}>
          {rightPane}
        </Pane>
      </Box>

      {/* Status bar */}
      <Box width={terminalWidth} height={statusBarHeight} borderStyle="round" borderColor="red">
        <Box paddingLeft={1} paddingRight={1} flexGrow={1} alignItems="center">
          <Text color="white">
            <Text color="white" bold>
              ?
            </Text>{' '}
            Help |
            <Text color="white" bold>
              {' '}
              q
            </Text>{' '}
            Quit |
            <Text color="white" bold>
              {' '}
              ⇥
            </Text>{' '}
            Switch pane |
            <Text color="white" bold>
              {' '}
              /
            </Text>{' '}
            Search |
            <Text color="white" bold>
              {' '}
              ↑/↓
            </Text>{' '}
            Navigate
          </Text>
        </Box>
        <Box paddingRight={1} alignItems="center">
          <Text color="white">paprik-ai v1.0</Text>
        </Box>
      </Box>
    </Box>
  );
}

function HelpBox({ width, height }: { width: number; height: number }) {
  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="round"
      borderColor="cyan"
      padding={1}
    >
      <Text bold underline>
        Keyboard Shortcuts
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          Global
        </Text>
        <Text> ? - Toggle this help</Text>
        <Text> q - Quit application</Text>
        <Text> Ctrl+C - Exit</Text>
        <Text> Tab - Focus next pane</Text>
        <Text> Shift+Tab - Focus previous pane</Text>
        <Text> Left/Right - Focus left/right pane</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          Recipe List
        </Text>
        <Text> Up/Down - Navigate recipes</Text>
        <Text> Page Up/Down - Page through list</Text>
        <Text> Home/End - Jump to first/last recipe</Text>
        <Text> / - Activate search</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          Recipe Detail
        </Text>
        <Text> Up/Down - Scroll content</Text>
        <Text> Page Up/Down - Page through content</Text>
        <Text> Home/End - Jump to top/bottom</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press ? or Esc to close</Text>
      </Box>
    </Box>
  );
}

function TooSmallBox({ width, height }: { width: number; height: number }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text color="red" bold>
        Terminal too small!
      </Text>
      <Text>
        Minimum size: {MIN_WIDTH}x{MIN_HEIGHT}
      </Text>
      <Text>
        Current size: {width}x{height}
      </Text>
      <Text dimColor>Please resize your terminal and try again.</Text>
    </Box>
  );
}
