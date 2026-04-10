import { Text, View } from 'react-native';

type ProductBadgeProps = {
  label: string;
  tone?: 'green' | 'orange' | 'slate';
};

export const ProductBadge = ({ label, tone = 'green' }: ProductBadgeProps) => {
  const classes =
    tone === 'orange'
      ? 'bg-orange-100 text-orange-700'
      : tone === 'slate'
        ? 'bg-slate-100 text-slate-600'
        : 'bg-green-100 text-green-700';

  return (
    <View className={`px-3 py-1.5 rounded-full ${classes}`}>
      <Text className="text-xs font-semibold">{label}</Text>
    </View>
  );
};