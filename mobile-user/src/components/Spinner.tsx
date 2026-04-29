import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors } from '../utils/colors';

interface SpinnerProps {
  text?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ text, size = 'large', fullScreen = false }) => (
  <View style={[styles.container, fullScreen && styles.fullScreen]}>
    <ActivityIndicator size={size} color={Colors.primary} />
    {text ? <Text style={styles.text}>{text}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  fullScreen: { flex: 1, backgroundColor: Colors.bgDark },
  text: { color: Colors.textMuted, marginTop: 10, fontSize: 14 },
});

export default Spinner;
