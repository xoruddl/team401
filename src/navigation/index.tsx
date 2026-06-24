import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../features/auth/hooks/useAuth';
import { useProfile } from '../features/mypage/hooks/useProfile';
import LoginScreen from '../pages/LoginScreen';
import PendingScreen from '../pages/PendingScreen';
import HomeScreen from '../pages/HomeScreen';
import CommunityScreen from '../pages/CommunityScreen';
import MyPageScreen from '../pages/MyPageScreen';
import MemberManagementScreen from '../pages/MemberManagementScreen';
import SeasonRoomScreen from '../pages/SeasonRoomScreen';
import VoteScreen from '../pages/VoteScreen';
import SkateboardRentalScreen from '../pages/SkateboardRentalScreen';
import BoardScreen from '../pages/BoardScreen';
import NoticeScreen from '../pages/NoticeScreen';

import { LoadingScreen } from '../components/LoadingScreen';
import { MainTabParamList, RootStackParamList } from './types';

export type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1a1a1a',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '활동',
          tabBarLabel: '활동',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏂</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          title: '커뮤니티',
          tabBarLabel: '커뮤니티',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>💬</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          title: '마이페이지',
          tabBarLabel: '마이페이지',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { session, loading: authLoading } = useAuth();
  const { isPending, loading: profileLoading } = useProfile();

  if (authLoading || (session && profileLoading)) {
    return <LoadingScreen background={false} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : isPending ? (
          <Stack.Screen name="Pending" component={PendingScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="SeasonRoom" component={SeasonRoomScreen} options={{ title: '시즌방' }} />
            <Stack.Screen name="Vote" component={VoteScreen} options={{ title: '선착순 투표' }} />
            <Stack.Screen
              name="MemberManagement"
              component={MemberManagementScreen}
              options={{ title: '회원 관리' }}
            />
            <Stack.Screen name="Board" component={BoardScreen} options={{ title: '게시판' }} />
            <Stack.Screen name="Notice" component={NoticeScreen} options={{ title: '공지사항' }} />
            <Stack.Screen
              name="SkateboardRental"
              component={SkateboardRentalScreen}
              options={{ title: '스케이트보드 대여' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
