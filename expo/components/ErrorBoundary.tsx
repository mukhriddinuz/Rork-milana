import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { logger } from '@/utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

/**
 * App-wide error boundary. Prevents a single render exception from
 * white-screening the whole app and gives the user a way to recover.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Something went wrong',
    };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    logger.error('[ErrorBoundary]', error, info);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, message: null });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.root}>
        <Text style={styles.eyebrow}>MILANA</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body} numberOfLines={4}>
          {this.state.message ?? 'An unexpected error occurred.'}
        </Text>
        <Pressable onPress={this.handleReset} style={styles.btn} testID="error-retry">
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 4,
    color: '#B53030',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#1A1A1A',
  },
  body: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 320,
  },
  btn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
