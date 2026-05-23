import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Pending: undefined;
  Main: undefined;
  SeasonRoom: undefined;
  Vote: undefined;
  MemberManagement: undefined;
  Board: undefined;
  Notice: undefined;
  SkateboardRental: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Community: undefined;
  MyPage: undefined;
};

export type TabScreenProps<T extends keyof MainTabParamList> = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, T>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};
