import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { FONT_FAMILY } from '../../constants/Typography';

/**
 * Custom Text component with serif font applied by default
 * Use this instead of React Native's Text component
 */
export function Text({ style, children, ...props }) {
  return (
    <RNText style={[styles.defaultText, style]} {...props}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: FONT_FAMILY.REGULAR,
  },
});

export default Text;

