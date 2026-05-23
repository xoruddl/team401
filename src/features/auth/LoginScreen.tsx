import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type Mode = 'signin' | 'signup';

const inputClass = 'border border-[#ddd] rounded-lg p-3 text-[15px] bg-white';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleKakaoLogin = async () => {
    const redirectTo = Linking.createURL('/');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo,
        queryParams: { scope: 'profile_nickname profile_image' },
      },
    });
    if (error || !data.url) return;
    await WebBrowser.openBrowserAsync(data.url);
  };

  const handleEmailSubmit = async () => {
    const e = email.trim();
    const p = password;
    if (!e || !p) return Alert.alert('오류', '이메일과 비밀번호를 입력하세요.');
    if (mode === 'signup' && !nickname.trim()) return Alert.alert('오류', '닉네임을 입력하세요.');
    if (mode === 'signup' && p.length < 6) return Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');

    setSubmitting(true);
    const { error } =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email: e,
            password: p,
            options: { data: { name: nickname.trim() } },
          })
        : await supabase.auth.signInWithPassword({ email: e, password: p });
    setSubmitting(false);

    if (error) {
      Alert.alert(mode === 'signup' ? '회원가입 실패' : '로그인 실패', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-2 mb-12">
          <Text className="text-4xl font-bold text-[#1a1a1a]">team401</Text>
          <Text className="text-base text-[#888]">스노보드 동아리</Text>
        </View>

        <TouchableOpacity
          className="bg-[#FEE500] py-4 rounded-xl items-center mb-6"
          onPress={handleKakaoLogin}
        >
          <Text className="text-base font-semibold text-[#1a1a1a]">카카오로 시작하기</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-3 mb-6">
          <View className="flex-1 h-px bg-[#eee]" />
          <Text className="text-xs text-[#aaa]">또는 이메일로</Text>
          <View className="flex-1 h-px bg-[#eee]" />
        </View>

        <View className="gap-3">
          {mode === 'signup' && (
            <TextInput
              className={inputClass}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임"
              autoCapitalize="none"
            />
          )}
          <TextInput
            className={inputClass}
            value={email}
            onChangeText={setEmail}
            placeholder="이메일"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <TextInput
            className={inputClass}
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            className={`bg-[#1a1a1a] py-4 rounded-xl items-center ${submitting ? 'opacity-60' : ''}`}
            onPress={handleEmailSubmit}
            disabled={submitting}
          >
            <Text className="text-base font-semibold text-white">
              {submitting ? '처리 중...' : mode === 'signup' ? '회원가입' : '로그인'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center py-2"
            onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            <Text className="text-sm text-[#1e88e5]">
              {mode === 'signin' ? '계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
