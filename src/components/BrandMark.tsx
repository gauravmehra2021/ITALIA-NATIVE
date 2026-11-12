import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

const brandLogo = require('../assets/logo.png');

type BrandMarkProps = {
  size?: number;
  medallion?: boolean;
  goldRim?: boolean;
};

/** Renders the official sseuropa emblem, optionally framed in a white circular medallion. */
export function BrandMark({ size = 40, medallion = false, goldRim = false }: BrandMarkProps) {
  const imageSize = medallion ? Math.round(size * 0.88) : size;
  const radius = size / 2;

  if (!medallion) {
    return (
      <Image
        source={brandLogo}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="contain"
        accessibilityLabel="sseuropa logo"
      />
    );
  }

  return (
    <View
      style={[
        styles.medallion,
        goldRim ? styles.goldRim : styles.defaultRim,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}>
      <Image
        source={brandLogo}
        style={{ width: imageSize, height: imageSize, borderRadius: imageSize / 2 }}
        resizeMode="contain"
        accessibilityLabel="sseuropa logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  medallion: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  defaultRim: {
    borderColor: colors.line,
    borderWidth: 1.5,
  },
  goldRim: {
    borderColor: colors.gold,
    borderWidth: 2.5,
  },
});
