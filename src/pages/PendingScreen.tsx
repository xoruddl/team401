import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../services/supabase';
import { useProfile } from '../features/mypage/hooks/useProfile';
import { Avatar } from '../components/Avatar';
import { LoadingScreen } from '../components/LoadingScreen';
import { RoleBadge } from '../components/RoleBadge';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

export default function PendingScreen() {
  const { profile, loading, refetch } = useProfile();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          supabase.auth.signOut();
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      className="flex-1 bg-[#f5f5f5]"
      contentContainerStyle={{ padding: 24, gap: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="items-center gap-2 mt-12">
        <Text className="text-3xl font-bold text-[#1a1a1a]">team401</Text>
        <Text className="text-base text-[#888]">스노보드 동아리</Text>
      </View>

      <View className="bg-white rounded-2xl p-6 items-center gap-3 shadow-sm shadow-black/[0.06]">
        <Avatar uri={profile?.avatar_url} size="xl" />
        <Text className="text-xl font-bold text-[#1a1a1a]">
          {profile?.nickname ?? '사용자'}
        </Text>
        <RoleBadge role="pending" size="md" full />
      </View>

      <View className="bg-white rounded-2xl p-6 gap-3 shadow-sm shadow-black/[0.06]">
        <Text className="text-base font-bold text-[#1a1a1a]">동아리 가입 신청 중</Text>
        <Text className="text-sm text-[#555] leading-5">
          현재 준회원 상태입니다. 운영자에게 정회원 승격을 요청해주세요.
          승인 후 시즌방, 투표, 게시판 등 모든 활동에 참여할 수 있습니다.
        </Text>
        <Text className="text-xs text-[#888] mt-2">
          · 운영자에게 본인 닉네임을 알려주세요{'\n'}
          · 승인이 완료되면 아래 새로고침을 눌러주세요
        </Text>
      </View>

      <TouchableOpacity
        className="bg-[#1e88e5] rounded-xl p-3.5 items-center"
        onPress={refetch}
      >
        <Text className="text-white font-semibold text-[15px]">새로고침</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-white rounded-xl p-3.5 items-center"
        onPress={handleLogout}
      >
        <Text className="text-[#e54848] font-semibold text-[15px]">로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
