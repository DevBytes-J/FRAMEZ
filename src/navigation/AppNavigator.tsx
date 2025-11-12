import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import CommentsScreen from "../screens/CommentsScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();


type RootStackParamList = {
  CreatePostModal: undefined;
  AppTabs: undefined;
};

const CreatePostButton = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handlePress = () => {
    console.log("Create Post button pressed");
    try {
      navigation.navigate("CreatePostModal");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{ marginRight: 15, padding: 5 }}
      activeOpacity={0.7}
    >
      <Ionicons name="add-circle-outline" size={30} color="#3b82f6" />
    </TouchableOpacity>
  );
};

function AppTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true, 
        tabBarActiveTintColor: "#3b82f6", 
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
          headerRight: () => <CreatePostButton />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Comments"
        component={CommentsScreen}
        options={{
          tabBarLabel: "Comments",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default AppTabNavigator;
