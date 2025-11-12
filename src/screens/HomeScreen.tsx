import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  useColorScheme,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { Post } from "../types";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

type RootStackParamList = {
  Home: undefined;
  Comments: { postId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

const PostCard: React.FC<{
  post: Post;
  currentUserId: string;
  onOpenComments: (postId: string) => void;
  theme: "light" | "dark";
}> = ({ post, currentUserId, onOpenComments, theme }) => {
  const likesArray: string[] = (post as any).likedBy || [];
  const isLiked = likesArray.includes(currentUserId);
  const likeCount = likesArray.length;

  const [scale] = useState(new Animated.Value(1));
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLikeAnimation = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.4,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLike = async () => {
    if (!currentUserId) {
      Alert.alert("Sign in required", "You must be signed in to like posts.");
      return;
    }
    try {
      const postRef = doc(db, "posts", post.id);
      if (isLiked) {
        await updateDoc(postRef, { likedBy: arrayRemove(currentUserId) });
      } else {
        handleLikeAnimation();
        await updateDoc(postRef, { likedBy: arrayUnion(currentUserId) });
      }
    } catch (err) {
      console.error("Like update error", err);
      Alert.alert("Error", "Couldn't update like. Try again.");
    }
  };

  const handleDelete = async () => {
    if (post.authorId !== currentUserId) {
      Alert.alert("Cannot Delete", "You can only delete your own posts.");
      return;
    }
    Alert.alert("Delete Post?", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "posts", post.id));
          } catch (err) {
            console.error("Delete post error:", err);
          }
        },
      },
    ]);
  };

  const ts = (post.timestamp as any)?.toDate
    ? (post.timestamp as any).toDate()
    : new Date();
  const formattedDate = ts.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const colors = useMemo(
    () => ({
      text: theme === "dark" ? "#f8fafc" : "#0f172a",
      subtext: theme === "dark" ? "#94a3b8" : "#64748b",
      card: theme === "dark" ? "#1e293b" : "#fff",
      border: theme === "dark" ? "#334155" : "#e2e8f0",
      icon: theme === "dark" ? "#fbbf24" : "#f97316",
      likeGradient: ["#ef4444", "#dc2626"],
    }),
    [theme]
  );

  return (
    <Animated.View
      style={[
        styles.postCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: colors.card,
          shadowOpacity: theme === "dark" ? 0.4 : 0.08,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.authorContainer} activeOpacity={0.7}>
          <View style={[styles.avatarContainer, { borderColor: colors.icon }]}>
            <Image
              source={{
                uri:
                  post.authorAvatarUrl ||
                  "https://placehold.co/100x100/A0A0A0/FFFFFF?text=U",
              }}
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: colors.text }]}>
              {post.authorName || "User"}
            </Text>
            <View style={styles.timestampRow}>
              <Ionicons name="time-outline" size={12} color={colors.subtext} />
              <Text style={[styles.timestamp, { color: colors.subtext }]}>
                {formattedDate}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {post.authorId === currentUserId && (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={["#ef4444", "#dc2626"]}
              style={styles.deleteGradient}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Image */}
      {post.imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)"]}
            style={styles.imageOverlay}
          />
        </View>
      )}

      {/* Content */}
      {post.content && (
        <View style={styles.contentContainer}>
          <Text style={[styles.content, { color: colors.text }]}>
            {post.content}
          </Text>
        </View>
      )}

      {/* Interaction Bar */}
      <View style={[styles.interactionBar, { borderColor: colors.border }]}>
        <View style={styles.leftActions}>
          {/* Like Button */}
          <TouchableOpacity
            onPress={handleLike}
            activeOpacity={0.7}
            style={styles.actionButton}
          >
            <Animated.View style={{ transform: [{ scale }] }}>
              {isLiked ? (
                <LinearGradient
                  colors={["#ef4444", "#dc2626"]}
                  style={styles.likedIconContainer}
                >
                  <Ionicons name="heart" size={20} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={styles.iconContainer}>
                  <Ionicons name="heart-outline" size={24} color="#ef4444" />
                </View>
              )}
            </Animated.View>
            <Text style={[styles.actionText, { color: colors.text }]}>
              {likeCount > 0 ? likeCount : "Like"}
            </Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity
            onPress={() => onOpenComments(post.id)}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name="chatbubble-outline"
                size={22}
                color={theme === "dark" ? "#38bdf8" : "#3b82f6"}
              />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>
              Comment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="paper-plane-outline"
              size={22}
              color={theme === "dark" ? "#a78bfa" : "#8b5cf6"}
            />
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("timestamp", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: Post[] = [];
        snap.forEach((d) => docs.push({ id: d.id, ...(d.data() as any) }));
        setPosts(docs);
        setLoading(false);
      },
      (err) => {
        console.error("posts snapshot error", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const openComments = (postId: string) => {
    navigation.navigate("Comments", { postId });
  };

  const bg = theme === "dark" ? "#0f172a" : "#f8fafc";
  const textColor = theme === "dark" ? "#e2e8f0" : "#475569";

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: bg }]}>
        <ActivityIndicator
          size="large"
          color={theme === "dark" ? "#fbbf24" : "#f97316"}
        />
        <Text style={[styles.loadingText, { color: textColor }]}>
          Loading frames...
        </Text>
      </View>
    );
  }

  if (!posts.length) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: bg }]}>
        <LinearGradient
          colors={
            theme === "dark" ? ["#1e293b", "#334155"] : ["#ffffff", "#f1f5f9"]
          }
          style={styles.emptyCard}
        >
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="images-outline"
              size={64}
              color={theme === "dark" ? "#64748b" : "#94a3b8"}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No Frames Yet
          </Text>
          <Text
            style={[
              styles.emptyText,
              { color: theme === "dark" ? "#94a3b8" : "#64748b" },
            ]}
          >
            Tap the + button to share your first frame with the world
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <FlatList
        data={posts}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user?.uid || ""}
            onOpenComments={openComments}
            theme={theme}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  listContent: {
    paddingVertical: 16,
  },
  postCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    borderWidth: 2,
    borderRadius: 28,
    padding: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  deleteGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 400,
    backgroundColor: "#0f172a10",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  contentContainer: {
    padding: 16,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  interactionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    padding: 4,
  },
  likedIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: "center",
    width: width - 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
