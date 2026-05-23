import 'react-native-url-polyfill/auto';
import './global.css';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './src/lib/supabase';
import { PreviewModeProvider } from './src/lib/previewMode';
import Navigation from './src/navigation';

export default function App() {
  useEffect(() => {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      const isOAuthCallback =
        url.includes('access_token') || url.includes('code=') || url.includes('error=');
      if (!isOAuthCallback) return;

      try {
        await WebBrowser.dismissBrowser();

        const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? '';
        const params = new URLSearchParams(fragment);

        const oauthError = params.get('error');
        if (oauthError) {
          Alert.alert('로그인 실패', params.get('error_description') ?? oauthError);
          return;
        }

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (!accessToken || !refreshToken) {
          Alert.alert('로그인 실패', '인증 정보를 받지 못했습니다. 다시 시도해 주세요.');
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) Alert.alert('로그인 실패', error.message);
      } catch (e) {
        const message = e instanceof Error ? e.message : '알 수 없는 오류';
        Alert.alert('로그인 실패', message);
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <PreviewModeProvider>
      <Navigation />
      <StatusBar style="auto" />
    </PreviewModeProvider>
  );
}
