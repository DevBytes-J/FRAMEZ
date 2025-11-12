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

const PostCardPlaceholder: React.FC<{ post: Post }> = ({ post }) => {
  const timestamp = post.timestamp?.toDate
    ? post.timestamp.toDate()
    : new Date();

  return (
    <View style={styles.postCard}>
      <Text style={styles.authorName}>{post.authorName}</Text>
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      <Text style={styles.postContent}>{post.content}</Text>
      <Text style={styles.postTimestamp}>{timestamp.toLocaleTimeString()}</Text>
    </View>
  );
};

export default function ProfileScreen() {
  const { user, profile, logout } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

      // Update profile in Firestore
      const profileRef = doc(db, "profiles", user.uid);
      await updateDoc(profileRef, {
        avatarUrl: downloadURL,
      });

      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      Alert.alert("Error", "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8A00" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.profileRow}>
        <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
          {uploadingAvatar ? (
            <View style={styles.avatar}>
              <ActivityIndicator size="small" color="#FF8A00" />
            </View>
          ) : profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={32} color="white" />
            </View>
          )}
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <View>
          <Text style={styles.profileName}>
            {profile.name || user?.email?.split("@")[0] || "User"}
          </Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.postsHeader}>Your Posts ({userPosts.length})</Text>
    </View>
  );

  return (
    <FlatList
      data={userPosts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCardPlaceholder post={item} />}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        !loadingPosts ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              You haven't posted anything yet.
            </Text>
          </View>
        ) : null
      }
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  postCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  authorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
  },
  postContent: {
    fontSize: 14,
    color: "#374151",
    marginVertical: 4,
  },
  postTimestamp: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#FF8A00",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  profileEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  logoutButton: {
    width: "100%",
    height: 40,
    backgroundColor: "#FF8A00",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  postsHeader: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 16,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    color: "#111827",
  },
  emptyContainer: {
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
  list: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
});
