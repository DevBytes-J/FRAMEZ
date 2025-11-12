A modern mobile social application built with React Native (Expo) that allows users to share posts with images and text, comment on content, and manage their profiles—all powered by Firebase.

---

### 📱 Demo
Try out the live demo here: [Launch Framez on Appetize.io](https://appetize.io/app/b_nqzgvgby6j2hb34oqudl2fwrla)

---

### ✨ Features

#### 🔐 Authentication
* Secure Sign Up, Login, and Logout
* Persistent user sessions (stay signed in across app restarts)

#### 📝 Posts
* Create and upload posts with text and/or images
* Feed displays posts from all users in most-recent-first order
* Each post shows:
    * Author's name
    * Timestamp
    * Author's profile avatar

#### 👤 Profile
* View logged-in user's information (name, email, avatar)
* See all posts created by the current user
* Edit profile details and upload custom avatars

#### 💬 Comments
* Comment on any post
* Keyboard automatically adjusts to avoid covering the input field
* Real-time comment updates

---

### 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React Native (Expo) |
| **Authentication** | Firebase Authentication (Email & Password) |
| **Database** | Firebase Firestore (Real-time data) |
| **Storage** | Firebase Storage (Images) |
| **State Management** | React Context API |

---

### 🚀 Installation

#### Prerequisites
* Node.js (v14 or higher)
* npm or yarn
* Expo CLI (`npm install -g expo-cli`)
* iOS Simulator or Android Emulator (optional)

#### Setup

```bash
# Clone the repository
git clone [https://github.com/DevBytes-J/FRAMEZ.git](https://github.com/DevBytes-J/FRAMEZ.git)
cd FRAMEZ

# Install dependencies
npm install
# or
yarn install

# Start the development server
npx expo start
Firebase Configuration
Create a Firebase project at Firebase Console

Enable Authentication (Email/Password)

Create a Firestore Database

Set up Firebase Storage

Add your Firebase configuration to the project (typically in firebaseConfig.js)

📖 Usage
Sign up for a new account

Update your profile with an avatar and name

Create posts with text or images

View posts in the feed and comment on them

Navigate to your profile to see your own posts

🐛 Known Issues & Future Work
There are a few issues currently being addressed:

Current Issues
Create Post Screen Layout: The top part of the create-post screen overlaps with the phone's status bar (unsafe area)

Comments Input Field:

Keyboard sometimes covers the input field when typing

Comment list doesn't always update immediately after adding a new comment

Real-Time Updates: Some real-time updates for posts and comments aren't fully reflecting in the UI yet

Planned Improvements
Fix SafeAreaView implementation for create post screen

Improve keyboard handling for comment input

Enhance real-time listener implementation

Add like/reaction functionality

Implement push notifications

Add image filters and editing capabilities

Support for video posts

Note: These issues are primarily due to project timeline and submission deadline constraints. Bug fixes and improvements will be implemented promptly.

🤝 Contributing
Contributions are welcome! Here's how you can help:

Fork the repository

Create a feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

Please make sure to update tests as appropriate and follow the existing code style.
```
📄 License
MIT License © 2025 DevBytes-J See LICENSE file for details.

👨‍💻 Author
DevBytes-J

GitHub: @DevBytes-J

🙏 Acknowledgments
React Native

Expo

Firebase

All contributors and supporters of this project

<p align="center">Made with ❤️ by DevBytes-J</p>
