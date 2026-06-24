import { RefreshControl, ScrollView } from 'react-native';
import { TabScreenProps } from '../navigation/types';
import { useProfile } from '../features/mypage/hooks/useProfile';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { MenuCard } from '../features/home/components/MenuCard';

export default function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const { refetch } = useProfile();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  return (
    <ScrollView
      className="flex-1 bg-[#f5f5f5]"
      contentContainerStyle={{ padding: 20, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <MenuCard
        emoji="⛄️"
        title="시즌방"
        description="인/아웃 날짜 등록 및 인원 조회"
        onPress={() => navigation.navigate('SeasonRoom')}
      />
      <MenuCard
        emoji="🎯"
        title="선착순 투표"
        description="활동 모집 및 대기 번호 확인"
        onPress={() => navigation.navigate('Vote')}
      />
      <MenuCard
        emoji="🛹"
        title="스케이트보드 대여"
        description="보드 번호별 대여 / 반납 현황"
        onPress={() => navigation.navigate('SkateboardRental')}
      />
    </ScrollView>
  );
}
