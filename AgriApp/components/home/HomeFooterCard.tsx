import { Text, View } from 'react-native';

import { AgriLogo } from '@/components/common/AgriLogo';

export const HomeFooterCard = () => {
	return (
		<View className="px-4 pb-6">
			<View className="bg-slate-900 rounded-[32px] p-5">
				<AgriLogo inverse compact />
				<Text className="text-slate-300 text-sm mt-3 leading-5">
					Mang nong san sach den gan hon voi gia dinh va shop cua ban.
				</Text>

				<View className="mt-4 gap-2">
					<Text className="text-slate-200 text-sm">contact@agri.com</Text>
					<Text className="text-slate-200 text-sm">0123 456 789</Text>
					<Text className="text-slate-200 text-sm">123, Ha Noi, Viet Nam</Text>
				</View>
			</View>
		</View>
	);
};
