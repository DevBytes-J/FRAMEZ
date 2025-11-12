// screens/WelcomeScreen.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

type RootStackParamList = {
  Welcome: undefined;
  Auth: { mode: "signup" | "login" } | undefined;
  AppTabs: undefined;
  CreatePostModal: undefined;
};

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animations for decorative elements
    const createFloatingAnimation = (
      animValue: Animated.Value,
      duration: number
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: -20,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFloatingAnimation(floatAnim1, 3000).start();
    createFloatingAnimation(floatAnim2, 4000).start();
    createFloatingAnimation(floatAnim3, 3500).start();
  }, []);

  return (
    <LinearGradient
      colors={["#FF6B35", "#FF8A00", "#FFA500", "#FFB84D"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Floating decorative circles */}
        <Animated.View
          style={[
            styles.circle,
            styles.circle1,
            { transform: [{ translateY: floatAnim1 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.circle,
            styles.circle2,
            { transform: [{ translateY: floatAnim2 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.circle,
            styles.circle3,
            { transform: [{ translateY: floatAnim3 }] },
          ]}
        />

        <View style={styles.content}>
          {/* Logo/Icon Section */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>📸</Text>
            </View>
            <View style={styles.sparkle1}>
              <Text style={{ fontSize: 24 }}>✨</Text>
            </View>
            <View style={styles.sparkle2}>
              <Text style={{ fontSize: 20 }}>✨</Text>
            </View>
          </Animated.View>

          {/* Title Section */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>Welcome to</Text>
            <Text style={styles.brandName}>Framez</Text>
            <View style={styles.underline} />
            <Text style={styles.tagline}>
              Where every moment becomes a masterpiece
            </Text>
          </Animated.View>

          {/* Features Pills */}
          <Animated.View
            style={[styles.featureContainer, { opacity: fadeAnim }]}
          >
            <View style={styles.featurePill}>
              <Text style={styles.featurePillText}>📷 Share</Text>
            </View>
            <View style={styles.featurePill}>
              <Text style={styles.featurePillText}>💬 Connect</Text>
            </View>
            <View style={styles.featurePill}>
              <Text style={styles.featurePillText}>✨ Inspire</Text>
            </View>
          </Animated.View>

          {/* Buttons Section */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Sign Up Button */}
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => navigation.navigate("Auth", { mode: "signup" })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FFFFFF", "#F5F5F5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.signUpText}>Get Started</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Log In Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate("Auth", { mode: "login" })}
              activeOpacity={0.8}
            >
              <BlurView intensity={20} style={styles.blurButton}>
                <Text style={styles.loginText}>Log In</Text>
              </BlurView>
            </TouchableOpacity>

            {/* Guest Mode */}
            <TouchableOpacity style={styles.guestButton}>
              <Text style={styles.guestText}>Continue as Guest</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Bottom Decoration */}
        <View style={styles.bottomWave}>
          <Text style={styles.bottomText}>
            Join thousands of creators worldwide
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },

  // Floating circles
  circle: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 1000,
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -40,
  },
  circle3: {
    width: 100,
    height: 100,
    top: 200,
    left: 30,
  },

  // Logo section
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 50,
  },
  sparkle1: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  sparkle2: {
    position: "absolute",
    bottom: 10,
    left: 10,
  },

  // Title section
  titleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "300",
    marginBottom: 5,
    letterSpacing: 2,
  },
  brandName: {
    fontSize: 56,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  underline: {
    width: 60,
    height: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 15,
  },
  tagline: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "300",
    maxWidth: 280,
    lineHeight: 24,
    opacity: 0.95,
  },

  // Features
  featureContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 50,
  },
  featurePill: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  featurePillText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Buttons
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  signUpButton: {
    width: "100%",
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  signUpText: {
    color: "#FF8A00",
    fontSize: 20,
    fontWeight: "700",
  },
  buttonArrow: {
    color: "#FF8A00",
    fontSize: 24,
    fontWeight: "bold",
  },
  loginButton: {
    width: "100%",
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  blurButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  guestButton: {
    paddingVertical: 15,
    alignItems: "center",
  },
  guestText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    textDecorationLine: "underline",
    opacity: 0.8,
  },

  // Bottom section
  bottomWave: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bottomText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "400",
    opacity: 0.8,
  },
});
