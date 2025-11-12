import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  StyleSheet,
  useColorScheme,
} from "react-native";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Comment = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp?: any;
};

const CommentBubble: React.FC<{
  comment: Comment;
  isCurrentUser: boolean;
  theme: "light" | "dark";
}> = ({ comment, isCurrentUser, theme }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const colors = {
    myBubble: theme === "dark" ? "#3b82f6" : "#4f46e5",
    otherBubble: theme === "dark" ? "#1e293b" : "#f1f5f9",
    myText: "#ffffff",
    otherText: theme === "dark" ? "#e2e8f0" : "#1e293b",
    timestamp: theme === "dark" ? "#94a3b8" : "#64748b",
    bg: theme === "dark" ? "#0f172a" : "#f8fafc",
  };

  const timestamp = comment.timestamp?.toDate
    ? comment.timestamp.toDate()
    : new Date();

  const timeString = timestamp.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Animated.View
      style={[
        styles.commentContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignItems: isCurrentUser ? "flex-end" : "flex-start",
        },
      ]}
    >
      <View
        style={[
          styles.commentBubble,
          {
            backgroundColor: isCurrentUser
              ? colors.myBubble
              : colors.otherBubble,
            borderBottomRightRadius: isCurrentUser ? 4 : 20,
            borderBottomLeftRadius: isCurrentUser ? 20 : 4,
            maxWidth: "75%",
          },
        ]}
      >
        {!isCurrentUser && (
          <Text
            style={[
              styles.authorName,
              { color: theme === "dark" ? "#fbbf24" : "#f97316" },
            ]}
          >
            {comment.authorName}
          </Text>
        )}
        <Text
          style={[
            styles.commentText,
            {
              color: isCurrentUser ? colors.myText : colors.otherText,
            },
          ]}
        >
          {comment.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            {
              color: isCurrentUser
                ? "rgba(255, 255, 255, 0.7)"
                : colors.timestamp,
              alignSelf: "flex-end",
            },
          ]}
        >
          {timeString}
        </Text>
      </View>
    </Animated.View>
  );
};

export default function CommentsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  // @ts-ignore
  const { postId } = route.params;
  const { profile, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const colors = {
    bg: theme === "dark" ? "#0f172a" : "#f8fafc",
    inputBg: theme === "dark" ? "#1e293b" : "#ffffff",
    inputBorder: theme === "dark" ? "#334155" : "#e2e8f0",
    inputText: theme === "dark" ? "#f1f5f9" : "#1e293b",
    placeholder: theme === "dark" ? "#64748b" : "#94a3b8",
    header: theme === "dark" ? "#1e293b" : "#ffffff",
    headerText: theme === "dark" ? "#f1f5f9" : "#1e293b",
  };

  useEffect(() => {
    if (!postId) return;
    const commentsRef = collection(db, "posts", postId, "comments");
    const q = query(commentsRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr: Comment[] = [];
        snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
        setComments(arr);
        setLoading(false);

        // Auto-scroll to bottom when new comment arrives
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (err) => {
        console.error("comments snapshot error", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [postId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    if (!user) {
      return Alert.alert(
        "Sign in required",
        "You must be signed in to comment."
      );
    }

    const messageText = text.trim();
    setText(""); // Clear input immediately for better UX

    setSubmitting(true);
    try {
      const commentsRef = collection(db, "posts", postId, "comments");
      await addDoc(commentsRef, {
        authorId: user.uid,
        authorName: profile?.name || "New User",
        text: messageText,
        timestamp: serverTimestamp(),
      });
      Keyboard.dismiss();
    } catch (err) {
      console.error("comment add error", err);
      setText(messageText); // Restore text on error
      Alert.alert("Error", "Failed to send comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <LinearGradient
          colors={
            theme === "dark" ? ["#1e293b", "#0f172a"] : ["#ffffff", "#f8fafc"]
          }
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme === "dark" ? "#f1f5f9" : "#1e293b"}
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.headerText }]}>
              Comments
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.placeholder }]}
            >
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </Text>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme === "dark" ? "#fbbf24" : "#f97316"}
            />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={comments}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <CommentBubble
                comment={item}
                isCurrentUser={item.authorId === user?.uid}
                theme={theme}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={64}
                    color={colors.placeholder}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.inputText }]}>
                  No comments yet
                </Text>
                <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                  Be the first to share your thoughts!
                </Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        {/* Input Area */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.inputBg,
              borderTopColor: colors.inputBorder,
            },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Write a comment..."
              placeholderTextColor={colors.placeholder}
              value={text}
              onChangeText={setText}
              style={[
                styles.input,
                {
                  backgroundColor: theme === "dark" ? "#0f172a" : "#f1f5f9",
                  color: colors.inputText,
                },
              ]}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={submitting || !text.trim()}
              style={[
                styles.sendButton,
                {
                  opacity: submitting || !text.trim() ? 0.5 : 1,
                },
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#f97316", "#ea580c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendGradient}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  commentContainer: {
    marginBottom: 16,
  },
  commentBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  authorName: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 21,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    fontSize: 15,
    lineHeight: 20,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
