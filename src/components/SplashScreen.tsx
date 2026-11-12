import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

type SplashScreenProps = {
  readyToDismiss: boolean;
  onExitStart?: () => void;
  onFinish: () => void;
};

export function SplashScreen({ readyToDismiss, onExitStart, onFinish }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  const [isExiting, setIsExiting] = useState(false);
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.84)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const copyTranslateY = useRef(new Animated.Value(14)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.95)).current;
  const ringOpacity = useRef(new Animated.Value(0.35)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hasExitedRef = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(copyOpacity, {
        toValue: 1,
        duration: 520,
        delay: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(copyTranslateY, {
        toValue: 0,
        duration: 520,
        delay: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1550,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringScale, {
            toValue: 1.18,
            duration: 1100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 0.95,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.35,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [copyOpacity, copyTranslateY, logoOpacity, logoScale, progressAnim, ringOpacity, ringScale]);

  useEffect(() => {
    if (!readyToDismiss || hasExitedRef.current) {
      return;
    }
    hasExitedRef.current = true;
    setIsExiting(true);
    onExitStart?.();
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 360,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  }, [containerOpacity, onExitStart, onFinish, readyToDismiss]);

  const progressTranslateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 20),
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
      pointerEvents="auto">
      <StatusBar barStyle={isExiting ? 'dark-content' : 'light-content'} hidden={false} animated />

      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <View style={styles.center}>
        <View style={styles.emblemWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.mark,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}>
            <Text style={styles.markText}>SS</Text>
            <View style={styles.markUnderline} />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.wordmarkBlock,
            {
              opacity: copyOpacity,
              transform: [{ translateY: copyTranslateY }],
            },
          ]}>
          <Text style={styles.brandName}>sseuropa</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>LEARN · GROW · SUCCEED</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: copyOpacity }]}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { transform: [{ translateX: progressTranslateX }] },
            ]}
          />
        </View>
        <Text style={styles.loadingLabel}>Preparing your learning space</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: colors.deepNavy,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -110,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(20, 85, 184, 0.24)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -130,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(243, 181, 43, 0.08)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  emblemWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  mark: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.navy,
    borderWidth: 2.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  markText: {
    color: colors.white,
    fontSize: 33,
    fontWeight: '900',
    letterSpacing: -3,
  },
  markUnderline: {
    position: 'absolute',
    width: 38,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.gold,
    bottom: 20,
  },
  wordmarkBlock: {
    alignItems: 'center',
    marginTop: 22,
  },
  brandName: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.9,
  },
  divider: {
    width: 36,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.gold,
    marginTop: 12,
    marginBottom: 11,
  },
  tagline: {
    color: '#D7E3F8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.6,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 22,
  },
  progressTrack: {
    width: 140,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
  },
  progressFill: {
    width: 140,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  loadingLabel: {
    color: '#9DB4DA',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 12,
    letterSpacing: 0.2,
  },
});
