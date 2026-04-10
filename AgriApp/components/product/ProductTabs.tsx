import { View, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { useState } from 'react';

interface ProductTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProductTabs({ tabs, activeTab, onTabChange }: ProductTabsProps) {
  const { width } = useWindowDimensions();
  const tabWidth = width / tabs.length;

  return (
    <View className="flex-row bg-white border-b border-slate-100">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onTabChange(tab)}
          style={{ width: tabWidth }}
          className={`py-4 items-center justify-center border-b-2 ${
            activeTab === tab ? 'border-green-600' : 'border-transparent'
          }`}
        >
          <Text
            className={`font-semibold text-sm ${
              activeTab === tab ? 'text-green-600' : 'text-slate-500'
            }`}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
