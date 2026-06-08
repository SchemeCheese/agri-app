// Shared image picker + compressor for chat and AI chat.
//
// Why this exists: iPhone gallery photos are full-resolution (often 3-8MB, and
// HEIC on iOS). expo-image-picker's `quality` only re-encodes, it does NOT
// downscale, so uploads of raw assets routinely blew past the request timeout
// on physical devices ("operation has timed out"). Here we downscale + convert
// to JPEG before anything leaves the device, which slashes upload size, fixes
// the timeout, and sidesteps the HEIC mime-type issue (BE only accepts
// jpeg/png/webp/gif).
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// Thrown when the user denied photo-library access — callers show a friendly
// Vietnamese message and stop, instead of failing with a cryptic picker error.
export class ImagePickPermissionError extends Error {
  constructor(message = 'Can quyen truy cap thu vien anh de gui anh.') {
    super(message);
    this.name = 'ImagePickPermissionError';
  }
}

export type ProcessedImage = {
  uri: string;
  mimeType: 'image/jpeg';
  fileName: string;
  /** Present only when `includeBase64` was requested (AI socket flow). */
  base64?: string;
};

type PickOptions = {
  /** Downscale ceiling in px (only shrinks, never upscales). Default 1280. */
  maxWidth?: number;
  /** JPEG quality 0..1. Default 0.6. */
  compress?: number;
  /** Return base64 too (for the AI socket payload). Default false. */
  includeBase64?: boolean;
};

export const pickAndProcessImage = async (
  opts: PickOptions = {},
): Promise<ProcessedImage | null> => {
  const { maxWidth = 1280, compress = 0.6, includeBase64 = false } = opts;

  // Permission. On iOS this triggers the system prompt the first time; if the
  // user has previously denied, `granted` is false and we surface a friendly
  // error. On Web/Expo the API may be absent — fall through and let the picker
  // handle it.
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new ImagePickPermissionError();
  } catch (err) {
    if (err instanceof ImagePickPermissionError) throw err;
    /* permission API unavailable (web) — continue */
  }

  const picker = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1, // manipulator does the final compression
    allowsEditing: false,
    base64: false,
    exif: false,
  });
  if (picker.canceled) return null;

  const asset = picker.assets?.[0];
  if (!asset?.uri) return null;

  // Only downscale when the source is wider than our ceiling — resizing a
  // small image up would just inflate the payload.
  const actions =
    asset.width && asset.width > maxWidth
      ? [{ resize: { width: maxWidth } }]
      : [];

  const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: includeBase64,
  });

  return {
    uri: result.uri,
    mimeType: 'image/jpeg',
    fileName: `img-${Date.now()}.jpg`,
    base64: includeBase64 ? result.base64 ?? undefined : undefined,
  };
};
