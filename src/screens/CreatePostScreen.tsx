import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Animated,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { db, storage } from "../firebase/config";
import {
  doc,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import { Post, UserProfile } from "../types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function CreatePostScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";

  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const colors = {
    bg: theme === "dark" ? "#0f172a" : "#f8fafc",
    card: theme === "dark" ? "#1e293b" : "#ffffff",
    text: theme === "dark" ? "#f1f5f9" : "#0f172a",
    subtext: theme === "dark" ? "#94a3b8" : "#64748b",
    border: theme === "dark" ? "#334155" : "#e2e8f0",
    inputBg: theme === "dark" ? "#0f172a" : "#f1f5f9",
    accent: theme === "dark" ? "#fbbf24" : "#f97316",
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const profileRef = doc(db, "profiles", user.uid);
        const docSnap = await getDoc(profileRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile({
            id: user.uid,
            email: user.email || "no-email@example.com",
            name: "New User",
            avatarUrl: "https://www.gravatar.com/avatar/?d=mp",
            createdAt: undefined,
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile({
          id: user.uid,
          email: user.email || "no-email@example.com",
          name: "New User",
          avatarUrl: "https://www.gravatar.com/avatar/?d=mp",
          createdAt: undefined,
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "We need access to your photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const uploadImage = async (uri: string, postId: string): Promise<string> => {
    try {
      const ext = uri.split(".").pop();
      const storageRef = ref(
        storage,
        `user_uploads/${user!.uid}/${postId}.${ext}`
      );
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handlePost = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to post.");
      return;
    }

    if (!content.trim() && !imageUri) {
      Alert.alert("Error", "Add content or an image to post.");
      return;
    }

    setLoading(true);
    try {
      const postsCollection = collection(db, "posts");
      const newPostRef = doc(postsCollection);
      const postId = newPostRef.id;

      let imageUrl: string | undefined = undefined;
      if (imageUri) imageUrl = await uploadImage(imageUri, postId);

      const newPost: Omit<Post, "id"> = {
        authorId: user.uid,
        authorName: profile?.name || "New User",
        authorAvatarUrl:
          profile?.avatarUrl || "https://www.gravatar.com/avatar/?d=mp",
        content: content.trim(),
        imageUrl,
        timestamp: serverTimestamp() as any,
      };

      await addDoc(postsCollection, newPost);

      Alert.alert("Success", "Frame published! 🎉");
      setContent("");
      setImageUri(null);
      navigation.goBack();
    } catch (error: any) {
      console.error("Post error:", error);
      Alert.alert("Error", "Failed to publish post. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  const charCount = content.length;
  const maxChars = 500;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Header */}
            <LinearGradient
              colors={
                theme === "dark"
                  ? ["#1e293b", "#0f172a"]
                  : ["#f97316", "#ea580c"]
              }
              style={styles.header}
            >
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Ionicons name="camera" size={32} color="#fff" />
                <Text style={styles.headerTitle}>Create Frame</Text>
              </View>
              <View style={styles.headerRight} />
            </LinearGradient>

            {/* User Info */}
            <View
              style={[styles.userSection, { backgroundColor: colors.card }]}
            >
              <Image
                source={{
                  uri:
                    profile?.avatarUrl ||
                    "https://www.gravatar.com/avatar/?d=mp",
                }}
                style={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {profile?.name || "New User"}
                </Text>
                <View style={styles.visibilityBadge}>
                  <Ionicons
                    name="globe-outline"
                    size={14}
                    color={colors.accent}
                  />
                  <Text
                    style={[styles.visibilityText, { color: colors.subtext }]}
                  >
                    Public
                  </Text>
                </View>
              </View>
            </View>

            {/* Content Input */}
            <View
              style={[styles.contentCard, { backgroundColor: colors.card }]}
            >
              <TextInput
                placeholder="What's on your mind? Share your moment..."
                placeholderTextColor={colors.subtext}
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={maxChars}
                editable={!loading}
                style={[
                  styles.contentInput,
                  { color: colors.text, backgroundColor: colors.inputBg },
                ]}
              />
              <View style={styles.charCountContainer}>
                <Text
                  style={[
                    styles.charCount,
                    {
                      color:
                        charCount > maxChars * 0.9 ? "#ef4444" : colors.subtext,
                    },
                  ]}
                >
                  {charCount} / {maxChars}
                </Text>
              </View>
            </View>

            {/* Image Preview */}
            {imageUri && (
              <View
                style={[styles.imageCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.5)"]}
                    style={styles.imageOverlay}
                  />
                  <TouchableOpacity
                    onPress={() => setImageUri(null)}
                    style={styles.removeImageButton}
                  >
                    <LinearGradient
                      colors={["#ef4444", "#dc2626"]}
                      style={styles.removeImageGradient}
                    >
                      <Ionicons name="close" size={20} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Add Media Section */}
            {!imageUri && (
              <View
                style={[styles.mediaCard, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Add to your frame
                </Text>
                <View style={styles.mediaOptions}>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    disabled={loading}
                    style={[
                      styles.mediaOption,
                      { backgroundColor: colors.inputBg },
                    ]}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={["#f97316", "#ea580c"]}
                      style={styles.mediaIconContainer}
                    >
                      <Ionicons name="image" size={24} color="#fff" />
                    </LinearGradient>
                    <Text
                      style={[styles.mediaOptionText, { color: colors.text }]}
                    >
                      Photo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.mediaOption,
                      { backgroundColor: colors.inputBg, opacity: 0.5 },
                    ]}
                    disabled
                  >
                    <LinearGradient
                      colors={["#3b82f6", "#2563eb"]}
                      style={styles.mediaIconContainer}
                    >
                      <Ionicons name="videocam" size={24} color="#fff" />
                    </LinearGradient>
                    <Text
                      style={[styles.mediaOptionText, { color: colors.text }]}
                    >
                      Video
                    </Text>
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Soon</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.mediaOption,
                      { backgroundColor: colors.inputBg, opacity: 0.5 },
                    ]}
                    disabled
                  >
                    <LinearGradient
                      colors={["#8b5cf6", "#7c3aed"]}
                      style={styles.mediaIconContainer}
                    >
                      <Ionicons name="location" size={24} color="#fff" />
                    </LinearGradient>
                    <Text
                      style={[styles.mediaOptionText, { color: colors.text }]}
                    >
                      Location
                    </Text>
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Soon</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Post Button */}
            <TouchableOpacity
              onPress={handlePost}
              disabled={loading || (!content.trim() && !imageUri)}
              style={[
                styles.postButton,
                {
                  opacity: loading || (!content.trim() && !imageUri) ? 0.5 : 1,
                },
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#f97316", "#ea580c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.postGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.postButtonText}>Publish Frame</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  headerRight: {
    width: 44,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  visibilityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  contentCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    padding: 16,
    borderRadius: 12,
    textAlignVertical: "top",
  },
  charCountContainer: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  charCount: {
    fontSize: 13,
    fontWeight: "600",
  },
  imageCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePreview: {
    width: "100%",
    height: 300,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  removeImageGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  mediaOptions: {
    flexDirection: "row",
    gap: 12,
  },
  mediaOption: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    position: "relative",
  },
  mediaIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  mediaOptionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  comingSoonBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  postButton: {
    marginHorizontal: 16,
    marginTop: 24,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  postGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  postButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
});
