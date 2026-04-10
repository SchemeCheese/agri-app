import { FontAwesome } from '@expo/vector-icons';
import { View, TextInput } from 'react-native';

type SearchInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export const SearchInput = ({ value, onChangeText, placeholder }: SearchInputProps) => {
  return (
    <View className="flex-row items-center bg-white px-4 py-3.5 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/40">
      <FontAwesome name="search" size={16} color="#9CA3AF" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Tim nong san...'}
        className="flex-1 ml-3 text-slate-700"
      />
    </View>
  );
};
