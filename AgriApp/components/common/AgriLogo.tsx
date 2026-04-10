import { memo } from 'react';
import { Text, View } from 'react-native';

type AgriLogoProps = {
  inverse?: boolean;
  compact?: boolean;
};

export const AgriLogo = memo(({ inverse = false, compact = false }: AgriLogoProps) => {
  const textColor = inverse ? '#FFFFFF' : '#0F172A';
  const accentColor = '#33D17A';
  const markSize = compact ? 20 : 24;
  const boxSize = compact ? 28 : 34;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: 10,
          backgroundColor: inverse ? 'rgba(255,255,255,0.16)' : '#15803D',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: markSize,
            height: markSize,
            borderTopLeftRadius: 999,
            borderBottomRightRadius: 999,
            backgroundColor: inverse ? '#FFFFFF' : '#F8FAFC',
            transform: [{ rotate: '-40deg' }],
            top: 4,
            left: 4,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: Math.round(markSize * 0.65),
            height: Math.round(markSize * 0.65),
            borderRadius: 999,
            backgroundColor: '#7FF2C5',
            right: 2,
            top: 2,
            transform: [{ rotate: '35deg' }],
          }}
        />
      </View>

      <Text
        style={{
          fontSize: compact ? 18 : 22,
          fontWeight: '800',
          letterSpacing: 0.4,
          color: textColor,
        }}
      >
        AGRI
        <Text style={{ color: accentColor }}>-</Text>
        CONNECT
      </Text>
    </View>
  );
});

AgriLogo.displayName = 'AgriLogo';