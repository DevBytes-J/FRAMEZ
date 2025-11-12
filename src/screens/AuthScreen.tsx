import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Alert, ActivityIndicator } from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { UserProfile } from "../types";

export default function AuthScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userProfile: UserProfile = {
        id: user.uid,
        name: name,
        email: user.email!,
        createdAt: serverTimestamp() as any,
      };

      await setDoc(doc(db, "profiles", user.uid), userProfile);

      Alert.alert("Success", "Account created and profile saved!");
    } catch (e: any) {
      console.error("Sign Up Error:", e);
      Alert.alert("Sign Up Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Logged in successfully!");
    } catch (e: any) {
      console.error("Login Error:", e);
      Alert.alert("Login Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = () => {
    if (isRegistering) {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-6 bg-white">
      <Text className="text-4xl font-extrabold text-indigo-700 mb-8">
        {isRegistering ? "Join Flicker" : "Welcome Back"}
      </Text>

      {isRegistering && (
        <TextInput
          className="w-full h-12 border border-gray-300 rounded-lg p-3 mb-4 text-base"
          placeholder="Display Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}
      <TextInput
        className="w-full h-12 border border-gray-300 rounded-lg p-3 mb-4 text-base"
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        className="w-full h-12 border border-gray-300 rounded-lg p-3 mb-6 text-base"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleAuth}
        className="w-full h-12 bg-[#FF8A00] rounded-lg justify-center items-center"
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-white text-lg font-semibold">
            {isRegistering ? "Sign Up" : "Log In"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsRegistering(!isRegistering)}
        className="mt-6"
      >
        <Text className="text-sm text-gray-500">
          {isRegistering
            ? "Already have an account? "
            : "Don't have an account? "}
          <Text className="text-indigo-700 font-semibold">
            {isRegistering ? "Log In" : "Sign Up"}
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
