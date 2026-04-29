import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../utils/colors';

interface ListItemProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  last?: boolean;
}

const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  right,
  left,
  onPress,
  style,
  last = false,
}) => {
  const Container: any = onPress ? TouchableOpacity : View;
  return (
    <Container
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.row, !last && styles.border, style]}
    >
      {left && <View style={styles.left}>{left}</View>}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </Container>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  left: { marginRight: 12 },
  content: { flex: 1 },
  title: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  subtitle: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  right: { marginLeft: 8 },
});

export default ListItem;
