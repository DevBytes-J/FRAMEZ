import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  StyleSheet,
  Alert,
  useColorScheme,
  Dimensions,
  Animated,
} from "react-native";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { db, storage } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { Post } from "../types";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const PostGridItem: React.FC<{
  post: Post;
  theme: "light" | "dark";
  onPress: () => void;
}> = ({ post, theme, onPress }) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const colors = {
    overlay: theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)",
    text: "#ffffff",
  };

  return (
    <Animated.View
      style={[styles.gridItem, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.gridTouchable}
      >
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
        ) : (
          <LinearGradient
            colors={["#f97316", "#ea580c"]}
            style={styles.gridPlaceholder}
          >
            <Ionicons name="image-outline" size={32} color="#fff" />
          </LinearGradient>
        )}
        <LinearGradient
          colors={["transparent", colors.overlay]}
          style={styles.gridOverlay}
        >
          {post.content && (
            <Text style={styles.gridText} numberOfLines={2}>
              {post.content}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ProfileScreen() {
  const { user, profile, logout } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // NOTE: Removed fadeAnim state and useEffect to simplify header rendering

  const colors = {
    bg: theme === "dark" ? "#0f172a" : "#f8fafc",
    card: theme === "dark" ? "#1e293b" : "#ffffff",
    text: theme === "dark" ? "#f1f5f9" : "#0f172a",
    subtext: theme === "dark" ? "#94a3b8" : "#64748b",
    border: theme === "dark" ? "#334155" : "#e2e8f0",
    accent: theme === "dark" ? "#fbbf24" : "#f97316",
  };

  useEffect(() => {
    if (!user) return;

    // NOTE: Assuming the Firebase indexing issue has been resolved.
    const q = query(
      collection(db, "posts"),
      where("authorId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPosts: Post[] = snapshot.docs.map((doc) => ({
          ...(doc.data() as Post),
          id: doc.id,
        }));
        setUserPosts(fetchedPosts);
        setLoadingPosts(false);
      },
      (error) => {
        console.error("Error fetching user posts:", error);
        setLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handlePickAvatar = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "We need access to your photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets?.length > 0) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking avatar:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      const ext = uri.split(".").pop();
      const storageRef = ref(storage, `avatars/${user.uid}.${ext}`);

      const response = await fetch(uri);
      const blob = await response.blob();

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      const profileRef = doc(db, "profiles", user.uid);
      await updateDoc(profileRef, {
        avatarUrl: downloadURL,
      });

      Alert.alert("Success", "Profile picture updated! 🎉");
    } catch (error) {
      console.error("Avatar upload error:", error);
      Alert.alert("Error", "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!profile) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading Profile...
        </Text>
      </View>
    );
  }

  const renderHeader = () => (
    // FIX: Replaced Animated.View with standard View to prevent opacity issue
    <View>
      {/* Cover Section */}
      <LinearGradient
        colors={
          theme === "dark" ? ["#1e293b", "#0f172a"] : ["#f97316", "#ea580c"]
        }
        style={styles.coverSection}
      >
        <View style={styles.coverContent}>
          {/* Avatar */}
          <TouchableOpacity
            onPress={handlePickAvatar}
            activeOpacity={0.8}
            style={styles.avatarTouchable}
          >
            <View style={styles.avatarWrapper}>
              {uploadingAvatar ? (
                <View style={[styles.avatar, { backgroundColor: colors.card }]}>
                  <ActivityIndicator size="large" color={colors.accent} />
                </View>
              ) : profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.subtext },
                  ]}
                >
                  <Ionicons name="person-outline" size={48} color="white" />
                </View>
              )}
              <LinearGradient
                colors={["#f97316", "#ea580c"]}
                style={styles.cameraIcon}
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </LinearGradient>
            </View>
          </TouchableOpacity>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {profile.name || user?.email?.split("@")[0] || "User"}
            </Text>
            <Text style={styles.userEmail}>{profile.email}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Section */}
      <View style={[styles.statsSection, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <LinearGradient
            colors={["#f97316", "#ea580c"]}
            style={styles.statIcon}
          >
            <Ionicons name="images" size={24} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {userPosts.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>
            Frames
          </Text>
        </View>

        <View
          style={[styles.statDivider, { backgroundColor: colors.border }]}
        />

        <View style={styles.statItem}>
          <LinearGradient
            colors={["#ef4444", "#dc2626"]}
            style={styles.statIcon}
          >
            <Ionicons name="heart" size={24} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {userPosts.reduce(
              (sum, post) => sum + ((post as any).likedBy?.length || 0),
              0
            )}
          </Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>
            Likes
          </Text>
        </View>

        <View
          style={[styles.statDivider, { backgroundColor: colors.border }]}
        />

        <View style={styles.statItem}>
          <LinearGradient
            colors={["#8b5cf6", "#7c3aed"]}
            style={styles.statIcon}
          >
            <Ionicons name="flame" size={24} color="#fff" />
          </LinearGradient>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Math.floor(Math.random() * 100) + 50}
          </Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>
            Score
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[
            styles.editButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color={colors.accent} />
          <Text style={[styles.editButtonText, { color: colors.text }]}>
            Edit Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#ef4444", "#dc2626"]}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          My Frames
        </Text>
        <View style={styles.gridIconContainer}>
          <Ionicons name="grid" size={20} color={colors.accent} />
        </View>
      </View>
    </View>
  );

  const renderEmpty = () =>
    !loadingPosts ? (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
          <Ionicons name="camera-outline" size={64} color={colors.subtext} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Frames Yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Start sharing your moments with the world!
          </Text>
        </View>
      </View>
    ) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={userPosts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <PostGridItem
            post={item}
            theme={theme}
            onPress={() => Alert.alert("Post", item.content || "View post")}
          />
        )}
        ListEmptyComponent={renderEmpty}
        // FIX: Removed contentContainerStyle (or its flexGrow: 1 property)
        // This stops the content from pushing the grid items down.
        // contentContainerStyle={styles.listContent}
        columnWrapperStyle={
          userPosts.length > 0 ? styles.columnWrapper : undefined
        }
        showsVerticalScrollIndicator={false}
      />
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
  // NOTE: listContent is kept but its usage is removed from FlatList
  listContent: {
    flexGrow: 1,
  },
  coverSection: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 24,
  },
  coverContent: {
    alignItems: "center",
  },
  avatarTouchable: {
    marginBottom: 20,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholder: {
    backgroundColor: "#9CA3AF",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  userInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  statsSection: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginTop: -40,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  actionsSection: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  logoutButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  gridIconContainer: {
    padding: 8,
  },
  columnWrapper: {
    paddingHorizontal: 16,
  },
  gridItem: {
    width: (width - 40) / 3,
    height: (width - 40) / 3,
    padding: 2,
  },
  gridTouchable: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  gridOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    justifyContent: "flex-end",
  },
  gridText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    width: width - 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
