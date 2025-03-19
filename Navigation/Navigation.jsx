import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import VideoFeed from "../screens/VideoFeed.jsx";
import CameraScreen from "../screens/CameraScreen.jsx";
import LoginScreen from "../screens/LoginScreen.jsx";
import ThemeToggleButton from "../components/ThemeToggleButton.tsx";
import useThemeStore from "../store/themeStore.js";

const Tab = createBottomTabNavigator();

export default function Navigation() {
  const { theme, toggleTheme } = useThemeStore(); // Get theme and toggle function

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: styles.activeTintColor.color,
        tabBarInactiveTintColor: styles.inactiveTintColor.color,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={VideoFeed}
        options={{
          headerRight: () => (
            <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
          ),
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          headerRight: () => (
            <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={LoginScreen}
        options={{
          headerRight: () => (
            <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "black",
    borderTopWidth: 0,
  },
  activeTintColor: {
    color: "white",
  },
  inactiveTintColor: {
    color: "gray",
  },
});
