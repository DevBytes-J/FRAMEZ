import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { ActivityIndicator, View } from "react-native";
import { UserProfile } from "../types"; 


interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}


export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});


export const useAuth = () => useContext(AuthContext);


interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const profileRef = doc(db, "profiles", currentUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        } else {
          const newProfile = {
            id: currentUser.uid,
            name: currentUser.displayName || "New User",
            email: currentUser.email || "No email",
            avatarUrl:
              currentUser.photoURL ||
              "https://i.ibb.co/6H0bB5D/default-avatar.png",
            createdAt: serverTimestamp(), 
          };

          await setDoc(profileRef, newProfile);
          setProfile({ ...newProfile, createdAt: undefined } as UserProfile);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = { user, profile, loading, logout };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <ActivityIndicator size="large" color="#FF8A00" />
        </View>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );  
};
