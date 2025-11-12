import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
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

export default function CreatePostScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // --- Fetch profile safely ---
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const profileRef = doc(db, "profiles", user.uid);
        const docSnap = await getDoc(profileRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          console.warn("Profile not found, using fallback.");
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

  // --- Pick image ---
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
    console.log("✅ Uploaded Image URL:", url);
    return url;
  } catch (error) {
    console.error("🔥 Upload error details:", JSON.stringify(error));
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

      Alert.alert("Success", "Post published!");
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
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#FF8A00" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-gray-50">
      <Text className="text-2xl font-bold text-indigo-700 mb-6">
        Create New Frame
      </Text>

      <TextInput
        className="w-full h-24 border border-gray-300 rounded-lg p-3 mb-4 bg-white"
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        multiline
        editable={!loading}
      />

      {imageUri && (
        <View className="mb-4 w-full h-48 border-2 border-[#FF8A00] rounded-lg overflow-hidden">
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
      )}

      <TouchableOpacity
        onPress={handlePickImage}
        className="w-full h-12 mb-6 border border-dashed border-gray-400 rounded-lg justify-center items-center"
        disabled={loading}
      >
        <Text className="text-gray-600">
          {imageUri ? "Change Image" : "Pick an Image"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handlePost}
        className="w-full h-12 bg-[#FF8A00] rounded-lg justify-center items-center"
        disabled={loading || (!content.trim() && !imageUri)}
        style={{ opacity: loading || (!content.trim() && !imageUri) ? 0.5 : 1 }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-white text-lg font-semibold">Post Frame</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
