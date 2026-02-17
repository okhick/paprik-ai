import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useStdout } from 'ink';
import { useAppState, useAppActions } from './AppContext.js';
import { Pane } from './Pane.js';
import type { FocusPane } from '../../types/tui.js';

/**
 * Minimum supported terminal dimensions
 */
const MIN_WIDTH = 80;
const MIN_HEIGHT = 24;

/**
 * Props for Layout component
 */
interface LayoutProps {
  /** Category pane content (optional, shown when category filter is active) */
  categoryPane?: React.ReactNode;
  /** Left pane content (recipe list) */
  leftPane: React.ReactNode;
  /** Right pane content (recipe detail) */
  rightPane: React.ReactNode;
}

/**
 * Layout container with optional 3-pane support
 *
 * Features:
 * - 2-pane (40/60) when categories hidden, 3-pane (20/30/50) when visible
 * - Terminal dimension detection with useStdout
 * - Minimum terminal size enforcement (80x24)
 * - Visual focus indicators
 * - Global keyboard navigation (Tab, Shift+Tab, Left/Right arrows)
 * - Press 'c' to toggle category pane
 */
export function Layout({ categoryPane, leftPane, rightPane }: LayoutProps): React.ReactElement {
  const { stdout } = useStdout();
  const state = useAppState();
  const actions = useAppActions();

  const {
    activePaneId,
    showHelp,
    isSearchActive,
    searchQuery,
    isCategoryFilterActive,
    selectedCategoryUids,
  } = state;
  const {
    setActivePaneId,
    toggleHelp,
    setSearchQuery,
    setIsSearchActive,
    setIsCategoryFilterActive,
    clearCategoryFilters,
  } = actions;

  // Get terminal dimensions
  const terminalWidth = stdout?.columns || MIN_WIDTH;
  const terminalHeight = stdout?.rows || MIN_HEIGHT;

  // Check if terminal meets minimum size
  const isTooSmall = terminalWidth < MIN_WIDTH || terminalHeight < MIN_HEIGHT;

  // Calculate pane dimensions based on whether categories are visible
  const categoryPaneWidth = isCategoryFilterActive ? Math.floor(terminalWidth * 0.2) : 0;
  const remainingWidth = terminalWidth - categoryPaneWidth;
  const listPaneWidth = isCategoryFilterActive
    ? Math.floor(remainingWidth * 0.375) // ~30% of total
    : Math.floor(terminalWidth * 0.4);
  const detailPaneWidth = remainingWidth - listPaneWidth;

  // Reserve rows for status bar at the bottom
  const statusBarHeight = 2;
  const paneHeight = terminalHeight - statusBarHeight;

  // Pane order for tab navigation
  const visiblePanes: FocusPane[] = isCategoryFilterActive
    ? ['categories', 'list', 'detail']
    : ['list', 'detail'];

  const nextPane = (current: FocusPane): FocusPane => {
    const idx = visiblePanes.indexOf(current);
    return visiblePanes[(idx + 1) % visiblePanes.length];
  };

  const prevPane = (current: FocusPane): FocusPane => {
    const idx = visiblePanes.indexOf(current);
    return visiblePanes[(idx - 1 + visiblePanes.length) % visiblePanes.length];
  };

  // Global keyboard shortcuts
  useInput(
    (input, key) => {
      // Quit with Ctrl+C or 'q' (always available)
      if ((key.ctrl && input === 'c') || input === 'q') {
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
      // Don't process keys handled by category pane when it's focused
      if (activePaneId === 'categories') {
        // 'c' - Close category pane
        if (input === 'c') {
          setIsCategoryFilterActive(false);
          setActivePaneId('list');
          return;
        }
        // Tab: cycle focus forward
        if (key.tab && !key.shift) {
          setActivePaneId(nextPane(activePaneId));
          return;
        }
        // Shift+Tab: cycle focus backward
        if (key.tab && key.shift) {
          setActivePaneId(prevPane(activePaneId));
          return;
        }
        // Right arrow: move to list pane
        if (key.rightArrow) {
          setActivePaneId('list');
          return;
        }

        return;
      }

      // 'c' - Toggle category filter pane (when not searching)
      if (input === 'c' && !isSearchActive) {
        if (isCategoryFilterActive) {
          setIsCategoryFilterActive(false);
          setActivePaneId('list');
        } else {
          setIsCategoryFilterActive(true);
          setActivePaneId('categories');
        }
        return;
      }

      // 'x' - Clear category filters (quick clear from list pane)
      if (input === 'x' && activePaneId === 'list' && selectedCategoryUids.length > 0) {
        clearCategoryFilters();
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
        setActivePaneId(nextPane(activePaneId));
        return;
      }

      // Shift+Tab: cycle focus backward
      if (key.tab && key.shift) {
        setActivePaneId(prevPane(activePaneId));
        return;
      }

      // Left arrow: focus previous pane
      if (key.leftArrow) {
        if (activePaneId === 'detail') {
          setActivePaneId('list');
          return;
        }
        if (activePaneId === 'list' && isCategoryFilterActive) {
          setActivePaneId('categories');
          return;
        }
      }

      // Right arrow: focus next pane
      if (key.rightArrow) {
        if (activePaneId === 'list') {
          setActivePaneId('detail');
          return;
        }
      }
    },
    { isActive: true }
  );

  if (isTooSmall) {
    return <TooSmallBox width={terminalWidth} height={terminalHeight} />;
  }
  if (showHelp) {
    return <HelpBox width={terminalWidth} height={terminalHeight} />;
  }

  // Render layout
  return (
    <Box width={terminalWidth} height={terminalHeight} flexDirection="column">
      <Box width={terminalWidth} height={paneHeight}>
        {/* Category pane (optional) */}
        {isCategoryFilterActive && categoryPane && (
          <Pane
            isFocused={activePaneId === 'categories'}
            width={categoryPaneWidth}
            height={paneHeight}
            title="Categories"
          >
            {categoryPane}
          </Pane>
        )}

        {/* List pane (Recipe List) */}
        <Pane isFocused={activePaneId === 'list'} width={listPaneWidth} height={paneHeight}>
          {leftPane}
        </Pane>

        {/* Detail pane (Recipe Detail) */}
        <Pane isFocused={activePaneId === 'detail'} width={detailPaneWidth} height={paneHeight}>
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
              c
            </Text>{' '}
            Categories |
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
        <Text> c - Toggle category pane</Text>
        <Text> x - Clear category filters</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          Categories
        </Text>
        <Text> Up/Down - Navigate categories</Text>
        <Text> Space/Enter - Toggle selection</Text>
        <Text> x - Clear all filters</Text>
        <Text> Esc - Close category pane</Text>
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
