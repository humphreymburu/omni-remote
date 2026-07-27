import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { RemoteScreen } from "../screens/RemoteScreen";
import { DevicesScreen } from "../screens/DevicesScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { DiscoveryScreen } from "../screens/DiscoveryScreen";
import { VoiceControlScreen } from "../screens/VoiceControlScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  Discovery: undefined;
  VoiceControl: undefined;
};

export type TabParamList = {
  Remote: undefined;
  Devices: undefined;
  Favorites: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111",
          borderTopColor: "#222",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tab.Screen
        name="Remote"
        component={RemoteScreen}
        options={{ tabBarLabel: "Remote" }}
      />
      <Tab.Screen
        name="Devices"
        component={DevicesScreen}
        options={{ tabBarLabel: "Devices" }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ tabBarLabel: "Favorites" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: "Settings" }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: "#3b82f6",
          background: "#050505",
          card: "#111",
          text: "#e0e0e0",
          border: "#222",
          notification: "#3b82f6",
        },
        fonts: {
          regular: { fontFamily: "System", fontWeight: "400" },
          medium: { fontFamily: "System", fontWeight: "500" },
          bold: { fontFamily: "System", fontWeight: "700" },
          heavy: { fontFamily: "System", fontWeight: "900" },
        },
      }}
    >
      <Stack.Navigator
        id="RootStack"
        screenOptions={{
          headerStyle: { backgroundColor: "#111" },
          headerTintColor: "#e0e0e0",
          contentStyle: { backgroundColor: "#050505" },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Discovery"
          component={DiscoveryScreen}
          options={{ title: "Add Device" }}
        />
        <Stack.Screen
          name="VoiceControl"
          component={VoiceControlScreen}
          options={{ title: "Voice Control", presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
