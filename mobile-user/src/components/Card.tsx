import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../utils/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accent?: boolean;
}

const Card: React.FC<CardProps> = ({ children, style, accent = false }) => (
  <View style={[styles.card, accent && styles.accent, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  accent: {
    borderColor: Colors.primary,
  },
});

export default Card;
