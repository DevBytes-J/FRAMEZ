import { Timestamp } from "firebase/firestore";

export interface Post {
  id: string; 
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string; 
  content: string; 
  imageUrl?: string; 
  timestamp: Timestamp; 
}


export interface UserProfile {
  id: string;
  name: string; 
  email: string; 
  avatarUrl?: string; 
  bio?: string;
  createdAt?: Timestamp; 
}
