import React from 'react';
import { Box, Text } from 'ink';

/**
 * Layout props
 */
export interface LayoutProps {
  title?: string;
  children: React.ReactNode;
  footer?: string;
}

/**
 * Common layout component with header and optional footer
 */
export const Layout: React.FC<LayoutProps> = ({ title, children, footer }) => {
  return (
    <Box flexDirection="column" padding={1}>
      {title && (
        <Box marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={2}>
          <Text bold color="cyan">
            {title}
          </Text>
        </Box>
      )}

      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>

      {footer && (
        <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={2}>
          <Text dimColor>{footer}</Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Error display component
 */
export const ErrorBox: React.FC<{ error: string }> = ({ error }) => {
  return (
    <Box borderStyle="round" borderColor="red" padding={1}>
      <Text color="red" bold>
        Error: {error}
      </Text>
    </Box>
  );
};

/**
 * Loading spinner component
 */
export const LoadingBox: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <Box>
      <Text color="yellow">{message}</Text>
    </Box>
  );
};
