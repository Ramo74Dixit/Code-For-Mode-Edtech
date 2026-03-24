import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

import CourseListScreen from '../screens/CourseListScreen';
import CourseDetailsScreen from '../screens/CourseDetailsScreen';
import BatchDetailsScreen from '../screens/BatchDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CourseStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CourseList" component={CourseListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BatchDetails" component={BatchDetailsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
            backgroundColor: COLORS.surface, // Dark background
            borderTopColor: 'rgba(255,255,255,0.05)', // Subtle border
            height: 60,
            paddingBottom: 10,
            paddingTop: 10,
            elevation: 0, // Remove shadow on Android
        },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
        }
      })}
    >
      <Tab.Screen name="Home" component={CourseStack} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Tab.Navigator>
  );
};

export default AppStack;
