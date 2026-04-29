import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { Colors } from '../utils/colors';

const { width, height } = Dimensions.get('window');

const EnergyBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.luxuryDeep, '#0a1025', '#060d1e']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={StyleSheet.absoluteFill}>
        <Svg height={height} width={width}>
          <Defs>
            <RadialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={Colors.luxuryDeep} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          
          {/* Subtle grid or energy lines */}
          <Path
            d={`M 0 ${height * 0.2} Q ${width * 0.5} ${height * 0.1} ${width} ${height * 0.25}`}
            fill="none"
            stroke={Colors.primary}
            strokeWidth="0.5"
            strokeOpacity="0.2"
          />
          <Path
            d={`M 0 ${height * 0.7} Q ${width * 0.3} ${height * 0.8} ${width} ${height * 0.6}`}
            fill="none"
            stroke={Colors.accent}
            strokeWidth="0.5"
            strokeOpacity="0.1"
          />
          
          {/* Glowing orbs */}
          <Circle cx={width * 0.8} cy={height * 0.15} r="100" fill="url(#grad)" />
          <Circle cx={width * 0.1} cy={height * 0.8} r="150" fill="url(#grad)" />
          
          {/* Geometric power pattern (Hexagons) */}
          <Path
            d="M50,10 L90,30 L90,70 L50,90 L10,70 L10,30 Z"
            fill="none"
            stroke={Colors.luxuryGold}
            strokeWidth="0.2"
            strokeOpacity="0.1"
            transform="scale(2) translate(100, 300)"
          />
          <Path
            d="M50,10 L90,30 L90,70 L50,90 L10,70 L10,30 Z"
            fill="none"
            stroke={Colors.luxuryGold}
            strokeWidth="0.2"
            strokeOpacity="0.05"
            transform="scale(3) translate(50, 500)"
          />
        </Svg>
      </View>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default EnergyBackground;
