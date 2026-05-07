import React, { useEffect } from 'react';
import { View, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate 
} from 'react-native-reanimated';
import { Gyroscope } from 'expo-sensors';

interface ParallaxWrapperProps {
  children: React.ReactNode;
}

export const ParallaxWrapper = ({ children }: ParallaxWrapperProps) => {
  const { width, height } = useWindowDimensions();
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMouseMove = (e: MouseEvent) => {
        // Calculate tilt based on mouse position relative to center
        const x = (e.clientX - width / 2) / (width / 2);
        const y = (e.clientY - height / 2) / (height / 2);
        
        rotateY.value = withSpring(x * 10); // Max 10 deg tilt
        rotateX.value = withSpring(-y * 10);
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    } else {
      // Mobile: Use Gyroscope
      const subscription = Gyroscope.addListener(({ x, y }) => {
        rotateX.value = withSpring(x * 15);
        rotateY.value = withSpring(y * 15);
      });
      Gyroscope.setUpdateInterval(50);
      return () => subscription.remove();
    }
  }, [width, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backfaceVisibility: 'hidden',
  },
});
