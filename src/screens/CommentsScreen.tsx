import React, { useEffect, useState } from "react";
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
import { useRoute } from "@react-navigation/native";
import { Alert } from "react-native";

type Comment = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp?: any;
};

export default function CommentsScreen() {
  const route = useRoute();
  // @ts-ignore
  const { postId } = route.params;
  const { profile, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      const commentsRef = collection(db, "posts", postId, "comments");
      await addDoc(commentsRef, {
        authorId: user.uid,
        authorName: profile?.name || "New User",
        text: text.trim(),
        timestamp: serverTimestamp(),
      });
      setText("");
      Keyboard.dismiss();
    } catch (err) {
      console.error("comment add error", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // adjust for header height
    >
      <FlatList
        data={comments}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderColor: "#eef2f7",
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontWeight: "700" }}>{item.authorName}</Text>
            <Text style={{ color: "#334155", marginTop: 6 }}>{item.text}</Text>
            <Text style={{ color: "#94a3b8", marginTop: 6, fontSize: 12 }}>
              {item.timestamp?.toDate
                ? item.timestamp.toDate().toLocaleString()
                : ""}
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ padding: 20 }}>
            <Text style={{ color: "#64748b" }}>
              No comments yet — be the first!
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      />


      <View
        style={{
          padding: 12,
          borderTopWidth: 1,
          borderColor: "#e6eef6",
          backgroundColor: "#fff",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            placeholder="Write a comment..."
            value={text}
            onChangeText={setText}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 12,
              backgroundColor: "#f1f5f9",
              borderRadius: 20,
              marginRight: 8,
            }}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={submitting || !text.trim()}
            style={{
              backgroundColor: "#FF8A00",
              padding: 10,
              borderRadius: 20,
            }}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
