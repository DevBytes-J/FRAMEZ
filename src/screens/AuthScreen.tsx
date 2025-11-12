// screens/AuthScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

type RootStackParamList = {
  Welcome: undefined;
  Auth: { mode: "signup" | "login" };
  AppTabs: undefined;
  CreatePostModal: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

export default function AuthScreen({ route, navigation }: Props) {
  const { mode } = route.params; // "signup" or "login"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignUp = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(db, "profiles", userCredential.user.uid), {
        id: userCredential.user.uid,
        name: name.trim(),
        email,
        createdAt: serverTimestamp(),
      });
      Alert.alert("Success", "Welcome to Framez! 🎉");
    } catch (e: any) {
      let errorMessage = "Something went wrong";
      if (e.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered";
      } else if (e.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      } else if (e.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email";
      }
      Alert.alert("Sign Up Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Welcome back! 👋");
    } catch (e: any) {
      let errorMessage = "Something went wrong";
      if (
        e.code === "auth/user-not-found" ||
        e.code === "auth/wrong-password"
      ) {
        errorMessage = "Invalid email or password";
      } else if (e.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email";
      } else if (e.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later";
      }
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = () => (mode === "signup" ? handleSignUp() : handleLogin());

  const switchMode = () => {
    const newMode = mode === "signup" ? "login" : "signup";
    navigation.setParams({ mode: newMode });
  };

  return (
    <LinearGradient
      colors={["#FF6B35", "#FF8A00", "#FFA500"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Welcome")}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Header Section */}
          <Animated.View
            style={[
              styles.headerContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{mode === "signup" ? "🎉" : "👋"}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {mode === "signup" ? "Join Framez" : "Welcome Back"}
            </Text>
            <Text style={styles.subtitle}>
              {mode === "signup"
                ? "Create an account to get started"
                : "Login to continue your journey"}
            </Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <BlurView intensity={20} style={styles.formBlur}>
              <View style={styles.formContent}>
                {mode === "signup" && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputIcon}>👤</Text>
                      <TextInput
                        placeholder="Enter your name"
                        placeholderTextColor="rgba(255, 138, 0, 0.5)"
                        value={name}
                        onChangeText={setName}
                        style={styles.input}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>📧</Text>
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255, 138, 0, 0.5)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255, 138, 0, 0.5)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleAuth}
                  disabled={loading}
                  style={styles.submitButton}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#FFFFFF", "#F5F5F5"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FF8A00" size="small" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>
                          {mode === "signup" ? "Create Account" : "Log In"}
                        </Text>
                        <Text style={styles.submitArrow}>→</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Forgot Password (Login only) */}
                {mode === "login" && (
                  <TouchableOpacity style={styles.forgotButton}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}
              </View>
            </BlurView>
          </Animated.View>

          {/* Switch Mode */}
          <Animated.View
            style={[styles.switchContainer, { opacity: fadeAnim }]}
          >
            <Text style={styles.switchQuestion}>
              {mode === "signup"
                ? "Already have an account?"
                : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={switchMode} activeOpacity={0.7}>
              <Text style={styles.switchButton}>
                {mode === "signup" ? "Log In" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Terms (Sign up only) */}
          {mode === "signup" && (
            <Animated.View
              style={[styles.termsContainer, { opacity: fadeAnim }]}
            >
              <Text style={styles.termsText}>
                By signing up, you agree to our{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },

  // Back Button
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backArrow: {
    fontSize: 24,
    color: "#FFFFFF",
    marginRight: 5,
  },
  backText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Header
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
  },

  // Form
  formContainer: {
    marginBottom: 30,
  },
  formBlur: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  formContent: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#FF8A00",
    fontWeight: "500",
  },

  // Submit Button
  submitButton: {
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  submitText: {
    color: "#FF8A00",
    fontSize: 18,
    fontWeight: "700",
  },
  submitArrow: {
    color: "#FF8A00",
    fontSize: 22,
    fontWeight: "bold",
  },

  // Forgot Password
  forgotButton: {
    alignSelf: "center",
    marginTop: 16,
  },
  forgotText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },

  // Switch Mode
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  switchQuestion: {
    color: "#FFFFFF",
    fontSize: 15,
    opacity: 0.9,
  },
  switchButton: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  // Terms
  termsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  termsText: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
