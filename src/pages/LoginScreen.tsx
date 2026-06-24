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
import { supabase } from '../services/supabase';

WebBrowser.maybeCompleteAuthSession();

type Mode = 'signin' | 'signup' | 'verify';

const inputClass = 'border border-[#ddd] rounded-lg p-3 text-[15px] bg-white';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleKakaoLogin = async () => {
    const redirectTo =
      Platform.OS === 'web' ? window.location.origin + '/' : Linking.createURL('/');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo,
        queryParams: { scope: 'profile_nickname profile_image' },
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) return;
    if (Platform.OS === 'web') {
      window.location.href = data.url;
    } else {
      await WebBrowser.openBrowserAsync(data.url);
    }
  };

  const showError = (msg: string) => setErrorMsg(msg);

  const handleEmailSubmit = async () => {
    const e = email.trim();
    const p = password;
    setErrorMsg('');
    if (!e || !p) return showError('이메일과 비밀번호를 입력하세요.');
    if (mode === 'signup' && !nickname.trim()) return showError('닉네임을 입력하세요.');
    if (mode === 'signup' && p.length < 6) return showError('비밀번호는 6자 이상이어야 합니다.');

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: e,
          password: p,
          options: { data: { name: nickname.trim() } },
        });
        if (error) {
          showError(error.message);
        } else if (!data.session) {
          setMode('verify');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: p });
        console.log('[login] session:', !!data.session, 'error:', error?.message);
        if (error) showError(error.message);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    const e = email.trim();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: e });
      if (error) {
        Alert.alert('재발송 실패', error.message);
      } else {
        Alert.alert('발송 완료', '인증 메일을 다시 보냈습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.';
      Alert.alert('오류', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'verify') {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 60, flex: 1, justifyContent: 'center' }}>
          <View className="items-center gap-2 mb-12">
            <Text className="text-4xl font-bold text-[#1a1a1a]">team401</Text>
            <Text className="text-base text-[#888]">스노보드 동아리</Text>
          </View>

          <View className="items-center gap-4 mb-10">
            <Text className="text-5xl">✉️</Text>
            <Text className="text-xl font-bold text-[#1a1a1a]">이메일을 확인해주세요</Text>
            <Text className="text-sm text-[#666] text-center leading-5">
              <Text className="font-semibold text-[#1a1a1a]">{email.trim()}</Text>
              {'\n'}으로 인증 메일을 보냈습니다.{'\n'}
              메일의 링크를 클릭하면 가입이 완료됩니다.
            </Text>
          </View>

          <TouchableOpacity
            className={`bg-[#1a1a1a] py-4 rounded-xl items-center mb-3 ${submitting ? 'opacity-60' : ''}`}
            onPress={handleResend}
            disabled={submitting}
          >
            <Text className="text-base font-semibold text-white">
              {submitting ? '발송 중...' : '인증 메일 다시 보내기'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center py-2"
            onPress={() => setMode('signin')}
          >
            <Text className="text-sm text-[#1e88e5]">로그인 화면으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

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

          {!!errorMsg && (
            <Text className="text-sm text-red-500 text-center">{errorMsg}</Text>
          )}

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
            onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrorMsg(''); }}
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
