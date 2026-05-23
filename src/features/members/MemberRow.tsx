import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { Profile, Role } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { RoleBadge } from '../../components/ui/RoleBadge';

type Props = {
  member: Profile;
  isSelf: boolean;
  isMaster: boolean;
  busy: boolean;
  onChangeRole: (newRole: Role) => void;
};

export function MemberRow({ member, isSelf, isMaster, busy, onChangeRole }: Props) {
  const role = member.role;
  const isTargetMaster = role === 'master';
  const locked = isSelf || (isTargetMaster && !isMaster);
  const name = member.nickname ?? '이 회원';

  const confirm = (title: string, message: string, destructive: boolean, action: () => void) => {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel' },
      { text: '확인', style: destructive ? 'destructive' : 'default', onPress: action },
    ]);
  };

  const approve = () =>
    confirm('회원 승인', `${name}을(를) 정회원으로 승인하시겠습니까?`, false, () =>
      onChangeRole('member'),
    );

  const promoteToAdmin = () =>
    confirm('운영자 임명', `${name}을(를) 운영자로 임명하시겠습니까?`, false, () =>
      onChangeRole('admin'),
    );

  const demoteFromAdmin = () =>
    confirm(
      '운영자 해제',
      `${name}의 운영자 권한을 해제하시겠습니까?`,
      true,
      () => onChangeRole('member'),
    );

  const demoteToPending = () =>
    confirm(
      '준회원으로 강등',
      `${name}을(를) 준회원으로 강등하시겠습니까? 모든 활동에 참여할 수 없게 됩니다.`,
      true,
      () => onChangeRole('pending'),
    );

  return (
    <View className="bg-white rounded-xl p-4 flex-row items-center gap-3 shadow-sm shadow-black/[0.06]">
      <Avatar uri={member.avatar_url} size="lg" />
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-[#1a1a1a]">
          {member.nickname ?? '이름 없음'}
          {isSelf ? ' (나)' : ''}
        </Text>
        <RoleBadge role={role} />
      </View>

      {locked ? (
        <Text className="text-xs text-[#bbb]">변경 불가</Text>
      ) : busy ? (
        <ActivityIndicator />
      ) : (
        <View className="gap-1.5">
          {role === 'pending' && (
            <TouchableOpacity
              className="bg-[#1e88e5] px-3 py-2 rounded-lg"
              onPress={approve}
            >
              <Text className="text-white text-sm font-semibold">회원 승인</Text>
            </TouchableOpacity>
          )}

          {role === 'member' && (
            <View className="flex-row gap-1.5">
              <TouchableOpacity
                className="bg-[#1e88e5] px-3 py-2 rounded-lg"
                onPress={promoteToAdmin}
              >
                <Text className="text-white text-xs font-semibold">운영자 임명</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#fef3c7] px-3 py-2 rounded-lg"
                onPress={demoteToPending}
              >
                <Text className="text-[#92400e] text-xs font-semibold">준회원 강등</Text>
              </TouchableOpacity>
            </View>
          )}

          {role === 'admin' && (
            <TouchableOpacity
              className="bg-[#fee2e2] px-3 py-2 rounded-lg"
              onPress={demoteFromAdmin}
            >
              <Text className="text-[#b91c1c] text-sm font-semibold">해제</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
