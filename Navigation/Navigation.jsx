import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";
import VideoFeed from "../screens/VideoFeed.jsx";
import CameraScreen from "../screens/CameraScreen.jsx";
import LoginScreen from "../screens/LoginScreen.jsx";

const Tab = createBottomTabNavigator();

export default function Navigation() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: styles.activeTintColor.color,
        tabBarInactiveTintColor: styles.inactiveTintColor.color,
      }}
    >
      <Tab.Screen name="Feed" component={VideoFeed} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Profile" component={LoginScreen} />
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
