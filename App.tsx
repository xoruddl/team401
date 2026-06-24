import 'react-native-url-polyfill/auto';
import './global.css';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PreviewModeProvider } from './src/services/previewMode';
import Navigation from './src/navigation';
import { useOAuthDeepLink } from './src/hooks/useOAuthDeepLink';

export default function App() {
  useOAuthDeepLink();

  const app = (
    <PreviewModeProvider>
      <Navigation />
      <StatusBar style="auto" />
    </PreviewModeProvider>
  );

  if (Platform.OS !== 'web') return app;

  return (
    <View className="flex-1 items-center bg-[#d4d4d4]">
      <View className="flex-1 w-full max-w-[430px] overflow-hidden rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
        {app}
      </View>
    </View>
  );
}
