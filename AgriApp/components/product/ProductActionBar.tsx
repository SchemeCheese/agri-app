import { Text, TouchableOpacity } from 'react-native';

type ProductActionBarProps = {
  onAddToCart: () => void;
};

export const ProductActionBar = ({ onAddToCart }: ProductActionBarProps) => {
  return (
    <TouchableOpacity onPress={onAddToCart} className="bg-[#15803D] rounded-2xl py-4 items-center">
      <Text className="text-white font-bold text-base">Them vao gio hang</Text>
    </TouchableOpacity>
  );
};