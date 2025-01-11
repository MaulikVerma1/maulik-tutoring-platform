import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  Auth
} from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs, increment, FieldValue, Firestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyBsM3NXVAVsEvusFewssHnXAZPeUG2smz0",
  authDomain: "test-dca57.firebaseapp.com",
  projectId: "test-dca57",
  storageBucket: "test-dca57.firebasestorage.app",
  messagingSenderId: "86742867263",
  appId: "1:86742867263:web:431ffc4c1c817ec7db878a",
  measurementId: "G-HFZY5WLJR3"
};

// Initialize Firebase only on client side
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

type FirestoreUpdate = {
  [K in keyof UserProgress]: UserProgress[K] | FieldValue;
};

interface UserProgress {
  AnalyticalReasoningTotal: number;
  RAnalyticalReasoning: number;
  LogicalReasoningTotal: number;
  RLogicalReasoning: number;
  ReadingComprehensionTotal: number;
  RReadingComprehension: number;
  totalGeneratedQuestionsAnswered: number;
  totalQuestionsAnswered: number;
  bookmarkedQuestions: string[];
  displayName: string;
  latestTestScore: number;
  testID: string;
  totalTestsCompleted: number;
}

export interface BookmarkData {
  id: string;
  userId: string;
  problem: {
    question: string;
    choices: string[];
    correctAnswer: number;
    difficulty: string;
    explanation?: string;
    userSelectedAnswer: number;
    userSelectedChoice: string;
    correctChoice: string;
    wasCorrect: boolean;
  };
  timestamp: string;
}


type FirebaseError = {
  code: string;
  message: string;
};

export const updateUserProgress = async (userId: string, difficulty: string, stats: { total: number, correct: number }) => {
  if (!db) throw new Error("Firestore not initialized");
  const userRef = doc(db, 'users', userId);
  
  const updates: Partial<FirestoreUpdate> = {
    totalGeneratedQuestionsAnswered: increment(1),
    totalQuestionsAnswered: increment(1)
  };

  switch (difficulty) {
    case 'easy':
      updates.AnalyticalReasoningTotal = stats.total;
      updates.RAnalyticalReasoning = stats.correct;
      break;
    case 'medium':
      updates.LogicalReasoningTotal = stats.total;
      updates.RLogicalReasoning = stats.correct;
      break;
    case 'hard':
      updates.ReadingComprehensionTotal = stats.total;
      updates.RReadingComprehension = stats.correct;
      break;
    default:
      throw new Error("Invalid difficulty level");
  }

  await setDoc(userRef, updates, { merge: true });
};

export const getUserProgress = async (userId: string): Promise<{
  easy: { total: number; correct: number };
  medium: { total: number; correct: number };
  hard: { total: number; correct: number };
}> => {
  if (!db) throw new Error("Firestore not initialized");
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 }
    };
  }
  
  const data = userDoc.data() as UserProgress;
  return {
    easy: { 
      total: data.AnalyticalReasoningTotal || 0, 
      correct: data.RAnalyticalReasoning || 0 
    },
    medium: { 
      total: data.LogicalReasoningTotal || 0, 
      correct: data.RLogicalReasoning || 0 
    },
    hard: { 
      total: data.ReadingComprehensionTotal || 0, 
      correct: data.RReadingComprehension || 0 
    }
  };
};

export const bookmarkProblem = async (userId: string, problem: BookmarkData['problem']) => {
  if (!db) throw new Error("Firestore not initialized");
  const bookmarkRef = doc(db, 'bookmarks', `${userId}_${Date.now()}`);
  await setDoc(bookmarkRef, {
    userId,
    problem,
    timestamp: new Date().toISOString()
  });

  // Update the user's bookmarkedQuestions array
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    bookmarkedQuestions: increment(1)
  });
};

export const getBookmarks = async (userId: string): Promise<BookmarkData[]> => {
  if (!db) throw new Error("Firestore not initialized");
  const bookmarksRef = collection(db, 'bookmarks');
  const q = query(bookmarksRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    userId,
    problem: doc.data().problem,
    timestamp: doc.data().timestamp
  }));
};

export const signUp = async (email: string, password: string) => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
        const userRef = doc(db as Firestore, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        totalQuestionsAnswered: 0,
        totalGeneratedQuestionsAnswered: 0,
        bookmarkedQuestions: [],
        totalTestsCompleted: 0,
        latestTestScore: 0,
        testID: '',
        displayName: '',
        AnalyticalReasoningTotal: 0,
        RAnalyticalReasoning: 0,
        LogicalReasoningTotal: 0,
        RLogicalReasoning: 0,
        ReadingComprehensionTotal: 0,
        RReadingComprehension: 0
      });
    }
    return userCredential.user;
  } catch (error: unknown) {
    const fbError = error as FirebaseError;
    console.error("Sign up error:", fbError.code, fbError.message);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: unknown) {
    const fbError = error as FirebaseError;
    console.error("Sign in error:", fbError.code, fbError.message);
    throw error;
  }
};

export const logOut = async () => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  try {
    await signOut(auth);
  } catch (error: unknown) {
    const fbError = error as FirebaseError;
    console.error("Sign out error:", fbError.code, fbError.message);
    throw error;
  }
};

export { auth, db };
