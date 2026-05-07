import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate,
  withSpring,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Gyroscope } from 'expo-sensors';

export const AnimatedBackground = () => {
  const { width, height } = useWindowDimensions();
  
  const blob1Pos = useSharedValue(0);
  const blob2Pos = useSharedValue(0);
  const parallaxX = useSharedValue(0);
  const parallaxY = useSharedValue(0);

  useEffect(() => {
    blob1Pos.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    blob2Pos.value = withRepeat(
      withTiming(1, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    if (Platform.OS === 'web') {
      const handleMove = (e: MouseEvent) => {
        parallaxX.value = withSpring((e.clientX - width / 2) / 20);
        parallaxY.value = withSpring((e.clientY - height / 2) / 20);
      };
      window.addEventListener('mousemove', handleMove);
      return () => window.removeEventListener('mousemove', handleMove);
    } else {
      const sub = Gyroscope.addListener(({ x, y }) => {
        parallaxX.value = withSpring(y * 30);
        parallaxY.value = withSpring(x * 30);
      });
      return () => sub.remove();
    }
  }, [width, height]);

  const animatedBlob1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(blob1Pos.value, [0, 1], [-50, 50]) + parallaxX.value },
      { translateY: interpolate(blob1Pos.value, [0, 1], [-20, 100]) + parallaxY.value },
      { scale: interpolate(blob1Pos.value, [0, 1], [1, 1.2]) }
    ],
  }));

  const animatedBlob2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(blob2Pos.value, [0, 1], [50, -50]) - parallaxX.value },
      { translateY: interpolate(blob2Pos.value, [0, 1], [100, -50]) - parallaxY.value },
      { scale: interpolate(blob2Pos.value, [0, 1], [1.2, 0.8]) }
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#F0F4F8', '#E6EEF5', '#F0F4F8']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={[styles.blob, styles.blob1, animatedBlob1, { width: width * 0.8, height: width * 0.8 }]} />
      <Animated.View style={[styles.blob, styles.blob2, animatedBlob2, { width: width * 0.6, height: width * 0.6 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.4,
  },
  blob1: {
    top: -100,
    left: -100,
    backgroundColor: '#34E0D0', // Teal
  },
  blob2: {
    bottom: 50,
    right: -50,
    backgroundColor: '#0F9B8E', // Darker Teal
  },
});
