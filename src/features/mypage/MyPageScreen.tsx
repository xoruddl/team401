import { Alert, RefreshControl, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useProfile } from './useProfile';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { RoleBadge } from '../../components/ui/RoleBadge';
import { TabScreenProps } from '../../navigation/types';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

export default function MyPageScreen({ navigation }: TabScreenProps<'MyPage'>) {
  const {
    profile,
    isAdmin,
    loading,
    canPreview,
    previewAsMember,
    setPreviewAsMember,
    refetch,
  } = useProfile();

  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;

  const role = profile?.role ?? 'member';
  const displayName = profile?.nickname ?? '사용자';

  return (
    <ScrollView
      className="flex-1 bg-[#f5f5f5]"
      contentContainerStyle={{ padding: 20, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="bg-white rounded-2xl p-6 items-center gap-3 shadow-sm shadow-black/[0.06]">
        <Avatar uri={profile?.avatar_url} size="xl" />
        <Text className="text-xl font-bold text-[#1a1a1a]">{displayName}</Text>
        <RoleBadge role={role} size="md" full />
      </View>

      {isAdmin && (
        <TouchableOpacity
          className="bg-white rounded-2xl p-5 flex-row items-center justify-between shadow-sm shadow-black/[0.06]"
          onPress={() => navigation.navigate('MemberManagement')}
        >
          <View className="flex-row items-center gap-3">
            <Text className="text-2xl">🛡️</Text>
            <Text className="text-base font-semibold text-[#1a1a1a]">회원 관리</Text>
          </View>
          <Text className="text-[#888] text-base">›</Text>
        </TouchableOpacity>
      )}

      {canPreview && (
        <View className="bg-white rounded-2xl p-5 flex-row items-center justify-between shadow-sm shadow-black/[0.06]">
          <View className="flex-row items-center gap-3 flex-1">
            <Text className="text-2xl">👁️</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-[#1a1a1a]">
                일반회원 화면 미리보기
              </Text>
              <Text className="text-xs text-[#888] mt-0.5">
                관리자 메뉴를 숨겨 일반회원 시점으로 봅니다.
              </Text>
            </View>
          </View>
          <Switch value={previewAsMember} onValueChange={setPreviewAsMember} />
        </View>
      )}

      <TouchableOpacity
        className="bg-white rounded-2xl p-5 shadow-sm shadow-black/[0.06]"
        onPress={handleLogout}
      >
        <Text className="text-base font-semibold text-[#e54848]">로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
