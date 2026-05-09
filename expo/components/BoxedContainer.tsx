import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface BoxedContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

const MAX_WIDTH = 1440;

function BoxedContainer({ children, style, noPadding }: BoxedContainerProps) {
  return (
    <View style={[styles.container, !noPadding && styles.padded, style]}>
      {children}
    </View>
  );
}

export { MAX_WIDTH };
export default React.memo(BoxedContainer);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  padded: {
    paddingHorizontal: 16,
  },
});
