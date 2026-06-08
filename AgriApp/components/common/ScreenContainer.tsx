import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenContainerProps = PropsWithChildren<{
  className?: string;
  /**
   * Pad the top safe area (iOS status bar / notch / Dynamic Island, Android
   * status bar under edge-to-edge). On by default so headers and top buttons
   * never render under the status bar. Set false ONLY for screens that want a
   * full-bleed element under the status bar.
   */
  topInset?: boolean;
  /** Also pad the bottom safe area — for screens without a tab bar / footer. */
  bottomInset?: boolean;
}>;

/**
 * Root wrapper for every screen. Applies the device safe-area insets so content
 * (and especially tappable headers) stays clear of the status bar. insets.top is
 * the real status-bar/notch height on iPhone, and 0 (or the small status-bar
 * height under edge-to-edge) on Android — so this is safe on both platforms and
 * never adds a hard-coded marginTop.
 */
export const ScreenContainer = ({
  children,
  className,
  topInset = true,
  bottomInset = false,
}: ScreenContainerProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-1 bg-[#F8FAFC] ${className ?? ''}`}
      style={{
        paddingTop: topInset ? insets.top : 0,
        paddingBottom: bottomInset ? insets.bottom : 0,
      }}
    >
      {children}
    </View>
  );
};
