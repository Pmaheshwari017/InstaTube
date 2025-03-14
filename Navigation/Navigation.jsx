import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import VideoFeed from '../screens/VideoFeed.jsx';
import CameraScreen from '../screens/CameraScreen.jsx';
import ProfileScreen from '../screens/ProfileScreen.jsx';

const Tab = createBottomTabNavigator();

export default function Navigation() {
  return (
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar, // Apply custom tab bar style
          tabBarActiveTintColor: styles.activeTintColor.color, // Active tab text color
          tabBarInactiveTintColor: styles.inactiveTintColor.color, // Inactive tab text color
        }}
      >
        <Tab.Screen name="Feed" component={VideoFeed} />
        <Tab.Screen name="Camera" component={CameraScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'black', // Background color of the tab bar
    borderTopWidth: 0, // Remove the top border
  },
  activeTintColor: {
    color: 'white', // Color for the active tab label
  },
  inactiveTintColor: {
    color: 'gray', // Color for the inactive tab label
  },
});