import React, { useEffect, useState, useMemo } from "react";
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

  const handleLikeAnimation = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.25,
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
      if (isLiked)
        await updateDoc(postRef, { likedBy: arrayRemove(currentUserId) });
      else {
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
      border: theme === "dark" ? "#334155" : "#f1f5f9",
      icon: theme === "dark" ? "#fbbf24" : "#f97316",
    }),
    [theme]
  );

  return (
    <View
      style={{
        marginVertical: 10,
        marginHorizontal: 16,
        borderRadius: 18,
        backgroundColor: colors.card,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: theme === "dark" ? 0.3 : 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
        <Image
          source={{
            uri:
              post.authorAvatarUrl ||
              "https://placehold.co/100x100/A0A0A0/FFFFFF?text=U",
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            marginRight: 12,
            borderWidth: 1,
            borderColor: colors.icon,
          }}
        />
        <View>
          <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }}>
            {post.authorName || "User"}
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 12 }}>
            {formattedDate}
          </Text>
        </View>
      </View>

      {/* Image */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={{ width: "100%", height: 360, backgroundColor: "#0f172a10" }}
          resizeMode="cover"
        />
      )}

      {/* Body */}
      {post.content && (
        <View style={{ padding: 14 }}>
          <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>
            {post.content}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={handleLike} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale }] }}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={24}
                color={isLiked ? "#ef4444" : colors.icon}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={{ marginLeft: 8, color: colors.text }}>{likeCount}</Text>

          <TouchableOpacity
            onPress={() => onOpenComments(post.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: 22,
            }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color={theme === "dark" ? "#38bdf8" : "#3b82f6"}
            />
            <Text style={{ marginLeft: 6, color: colors.text }}>Comments</Text>
          </TouchableOpacity>
        </View>

        {post.authorId === currentUserId && (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
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
    // Fetch ALL posts, not filtered by user
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: bg,
        }}
      >
        <ActivityIndicator
          size="large"
          color={theme === "dark" ? "#fbbf24" : "#f97316"}
        />
      </View>
    );
  }

  if (!posts.length) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: bg,
          padding: 24,
        }}
      >
        <Ionicons
          name="images-outline"
          size={56}
          color={theme === "dark" ? "#64748b" : "#94a3b8"}
        />
        <Text
          style={{
            marginTop: 16,
            fontSize: 18,
            color: textColor,
            textAlign: "center",
          }}
        >
          No frames yet — tap the + button to post your first frame.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
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
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}
