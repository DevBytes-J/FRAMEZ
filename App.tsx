// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AppTabNavigator from "./src/navigation/AppNavigator";
import AuthScreen from "./src/screens/AuthScreen";
import CreatePostScreen from "./src/screens/CreatePostScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";

// Define your stack param list
export type RootStackParamList = {
  Welcome: undefined;
  Auth: { mode: "signup" | "login" };
  AppTabs: undefined;
  CreatePostModal: undefined;
};

// Pass the type to createStackNavigator
const RootStack = createStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { user } = useAuth();

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <RootStack.Screen name="AppTabs" component={AppTabNavigator} />
          <RootStack.Screen
            name="CreatePostModal"
            component={CreatePostScreen}
            options={{ presentation: "modal" }}
          />
        </>
      ) : (
        <>
          <RootStack.Screen name="Welcome" component={WelcomeScreen} />
          <RootStack.Screen name="Auth" component={AuthScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
}
