'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth, signIn, signUp, logOut } from '../lib/firebase';

type AuthContextType = {
	currentUser: User | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<any>;
	signup: (email: string, password: string) => Promise<any>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
	return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = auth?.onAuthStateChanged((user) => {
			setCurrentUser(user);
			setLoading(false);
		});

		return () => unsubscribe?.();
	}, []);


	const value = {
		currentUser,
		loading,
		login: signIn,
		signup: signUp,
		logout: logOut,
	};

	return (
		<AuthContext.Provider value={value}>
			{!loading && children}
		</AuthContext.Provider>
	);
}