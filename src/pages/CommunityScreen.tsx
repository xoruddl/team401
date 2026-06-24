import { RefreshControl, ScrollView } from 'react-native';
import { TabScreenProps } from '../navigation/types';
import { useProfile } from '../features/mypage/hooks/useProfile';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { MenuCard } from '../features/home/components/MenuCard';

export default function CommunityScreen({ navigation }: TabScreenProps<'Community'>) {
  const { refetch } = useProfile();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  return (
    <ScrollView
      className="flex-1 bg-[#f5f5f5]"
      contentContainerStyle={{ padding: 20, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <MenuCard
        emoji="📢"
        title="공지사항"
        description="운영진이 전달하는 동아리 공지"
        onPress={() => navigation.navigate('Notice')}
      />
      <MenuCard
        emoji="📝"
        title="게시판"
        description="건의사항 · 자유 게시글"
        onPress={() => navigation.navigate('Board')}
      />
    </ScrollView>
  );
}
