'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getBookmarks, BookmarkData } from '../../lib/firebase';
import { useRouter } from 'next/navigation';


export default function BookmarksPage() {
	const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
	const [loading, setLoading] = useState(true);
	const auth = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!auth?.currentUser) {
			router.push('/');
			return;
		}

		const fetchBookmarks = async () => {
			if (!auth?.currentUser?.uid) {
				setLoading(false);
				return;
			}

			try {
				const userBookmarks = await getBookmarks(auth.currentUser.uid);
				setBookmarks(userBookmarks);
			} catch (error) {
				console.error('Error fetching bookmarks:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchBookmarks();
	}, [auth?.currentUser, router]);

	if (loading) {
		return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
	}

	return (
		<div className="min-h-screen bg-gray-100 p-6">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold mb-8">Your Bookmarked Problems</h1>
				
				<div className="space-y-4">
					{bookmarks.map((bookmark) => (
						<div key={bookmark.id} className="bg-white rounded-lg shadow-lg p-6">
							<h2 className="text-xl mb-4">{bookmark.problem.question}</h2>
							<div className="space-y-2">
								{bookmark.problem.choices.map((choice: string, index: number) => (
									<div
										key={index}
										className={`p-3 rounded ${
											index === bookmark.problem.userSelectedAnswer
												? bookmark.problem.wasCorrect
													? 'bg-green-100'
													: 'bg-red-100'
												: index === bookmark.problem.correctAnswer
												? 'bg-green-100'
												: 'bg-gray-50'
										}`}
									>
										<div className="flex justify-between items-center">
											<span>{choice}</span>
											{index === bookmark.problem.userSelectedAnswer && (
												<span className="text-sm font-medium">
													{bookmark.problem.wasCorrect ? '✓ Your Answer' : '✗ Your Answer'}
												</span>
											)}
											{index === bookmark.problem.correctAnswer && index !== bookmark.problem.userSelectedAnswer && (
												<span className="text-sm font-medium text-green-600">
													Correct Answer
												</span>
											)}
										</div>
									</div>
								))}
							</div>
							<div className="mt-4 p-4 bg-blue-50 rounded">
								<h3 className="font-semibold mb-2">Explanation:</h3>
								<p>{bookmark.problem.explanation}</p>
							</div>
							<div className="mt-4 text-sm text-gray-500">
								Bookmarked on: {new Date(bookmark.timestamp).toLocaleDateString()}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}