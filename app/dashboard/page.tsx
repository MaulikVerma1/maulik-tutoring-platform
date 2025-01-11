'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProgress, getUserProgress, bookmarkProblem, BookmarkData } from '../../lib/firebase';
import DonutChart from '../../components/DonutChart';


type Difficulty = 'easy' | 'medium' | 'hard';

type MathProblem = {
	question: string;
	choices: string[];
	correctAnswer: number;
	difficulty: Difficulty;
	explanation?: string;
};

interface Progress {
	easy: { total: number; correct: number };
	medium: { total: number; correct: number };
	hard: { total: number; correct: number };
}

export default function Dashboard() {
	const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [score, setScore] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('medium');
	const [showExplanation, setShowExplanation] = useState(false);
	const [stats, setStats] = useState<Progress>({
		easy: { total: 0, correct: 0 },
		medium: { total: 0, correct: 0 },
		hard: { total: 0, correct: 0 }
	});

	
	const auth = useAuth();
	const router = useRouter();

	const updateStats = async (difficulty: Difficulty, isCorrect: boolean) => {
		setStats(prev => ({
			...prev,
			[difficulty]: {
				total: prev[difficulty].total + 1,
				correct: prev[difficulty].correct + (isCorrect ? 1 : 0)
			}
		}));

		// Save stats to Firebase
		if (auth?.currentUser?.uid) {
			try {
				await updateUserProgress(auth.currentUser.uid, difficulty, stats[difficulty]);
			} catch (error) {
				console.error('Failed to save stats:', error);
			}
		}
	};


	useEffect(() => {
		if (!auth?.currentUser) {
			router.push('/');
			return;
		}
		
		const fetchData = async () => {
			if (auth?.currentUser?.uid) {
				try {
					const progress = await getUserProgress(auth.currentUser.uid);
					setStats(progress); // Set stats directly from progress


				} catch (error) {
					console.error('Failed to fetch progress:', error);
				}
			}
		};
		fetchData();
	}, [auth, router]);

	const generateNewProblem = async (difficulty: Difficulty) => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(`/api/generate-problem?difficulty=${difficulty}`);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.details || 'Failed to generate problem');
			}
			const problem = await response.json();
			setCurrentProblem(problem);
			setCurrentDifficulty(difficulty);
		} catch (error) {
			console.error('Failed to generate problem:', error);
			setError(error instanceof Error ? error.message : 'Failed to generate problem');
			setCurrentProblem(null);
		} finally {
			setLoading(false);
		}
	};

	const handleDifficultySelect = (difficulty: Difficulty) => {
		setSelectedAnswer(null);
		generateNewProblem(difficulty);
	};

	const handleAnswerSelect = async (index: number) => {
		if (selectedAnswer !== null) return;
		
		setSelectedAnswer(index);
		const correct = index === currentProblem?.correctAnswer;
		updateStats(currentDifficulty, correct);
		
		if (correct) {
			setScore(prev => prev + (currentDifficulty === 'easy' ? 1 : currentDifficulty === 'medium' ? 2 : 3));


		}

	};

	const handleNavigateToBookmarks = () => {
		router.push('/bookmarks');
	};

	const handleBookmark = async () => {
		if (!auth?.currentUser || !currentProblem || selectedAnswer === null) return;
		try {
			const problemWithUserAnswer: BookmarkData['problem'] = {
				...currentProblem,
				userSelectedAnswer: selectedAnswer,
				userSelectedChoice: currentProblem.choices[selectedAnswer],
				correctChoice: currentProblem.choices[currentProblem.correctAnswer],
				wasCorrect: selectedAnswer === currentProblem.correctAnswer
			};
			await bookmarkProblem(auth.currentUser.uid, problemWithUserAnswer);
			alert('Problem bookmarked successfully!');
		} catch (error) {
			console.error('Error bookmarking problem:', error);
		}
	};

	const handleNextProblem = () => {
		setSelectedAnswer(null);
		generateNewProblem(currentDifficulty);
	};

	const handleLogout = async () => {
		try {
			await auth?.logout();
			router.push('/');
		} catch (error) {
			console.error('Failed to logout:', error);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
			<div className="max-w-6xl mx-auto">
				{/* Header Section */}
				<div className="flex justify-between items-center mb-8 bg-white rounded-xl shadow-lg p-6">
					<div>
						<h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
							MMTP
						</h1>
						<p className="text-gray-600 mt-2 text-lg">Master mathematics through interactive challenges</p>
					</div>
					<div className="flex items-center gap-6">
						<div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-[2px] rounded-xl">
							<div className="bg-white px-6 py-3 rounded-xl">
								<span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
									Score: {score}
								</span>
							</div>
						</div>
						<button
							onClick={handleNavigateToBookmarks}
							className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
							</svg>
							Bookmarks
						</button>
						<button
							onClick={handleLogout}
							className="flex items-center gap-2 bg-gradient-to-r from-rose-400 to-red-500 text-white px-6 py-3 rounded-xl hover:from-rose-500 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
							</svg>
							Logout
						</button>
					</div>
				</div>

				{/* Progress Section */}
				<div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-[1.02] transition-transform w-full mb-8">
					<h2 className="text-2xl font-semibold mb-6 text-gray-800">Progress Tracking</h2>
					<div className="grid grid-cols-3 gap-6">

						{[
							{ name: 'easy' as const, color: '#22c55e', label: 'Easy' },
							{ name: 'medium' as const, color: '#eab308', label: 'Medium' },
							{ name: 'hard' as const, color: '#ef4444', label: 'Hard' }
						].map((diff) => (
							<div key={diff.name} className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-b from-white to-gray-50 shadow-sm">
								<DonutChart
									value={stats[diff.name].correct}
									total={stats[diff.name].total}
									color={diff.color}
								/>
								<span className="mt-2 capitalize font-medium">{diff.name}</span>

							</div>
						))}
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-lg p-8 backdrop-blur-sm bg-white/90">

					<div className="flex flex-wrap gap-4 mb-8 justify-center">
						<button
							onClick={() => handleDifficultySelect('easy')}
							className={`px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
								currentDifficulty === 'easy'
									? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg'
									: 'bg-green-100 hover:bg-green-200 text-green-700'
							}`}
						>
							Easy
						</button>
						<button
							onClick={() => handleDifficultySelect('medium')}
							className={`px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
								currentDifficulty === 'medium'
									? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg'
									: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
							}`}
						>
							Medium
						</button>
						<button
							onClick={() => handleDifficultySelect('hard')}
							className={`px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
								currentDifficulty === 'hard'
									? 'bg-gradient-to-r from-red-400 to-red-600 text-white shadow-lg'
									: 'bg-red-100 hover:bg-red-200 text-red-700'
							}`}
						>
							Hard
						</button>
					</div>

					{error && (
						<div className="text-center py-4 text-red-600 bg-red-100 rounded-lg mb-4">
							{error}
						</div>
					)}
					{loading ? (
						<div className="text-center py-8">Loading...</div>
					) : currentProblem ? (
						<>
							<h2 className="text-xl mb-6">{currentProblem.question}</h2>
							<div className="space-y-4">
								{currentProblem.choices.map((choice, index) => (
									<button
										key={index}
										onClick={() => !selectedAnswer && handleAnswerSelect(index)}
										className={`w-full p-4 text-left rounded ${
											selectedAnswer === null
												? 'hover:bg-blue-50 bg-gray-50'
												: selectedAnswer === index
												? index === currentProblem.correctAnswer
													? 'bg-green-100'
													: 'bg-red-100'
												: index === currentProblem.correctAnswer
												? 'bg-green-100'
												: 'bg-gray-50'
										}`}
										disabled={selectedAnswer !== null}
									>
										{choice}
									</button>
								))}
							</div>
							{selectedAnswer !== null && (
								<div className="mt-6 space-y-4">
									<button
										onClick={() => setShowExplanation(!showExplanation)}
										className="w-full bg-blue-100 text-blue-700 p-3 rounded-lg font-semibold hover:bg-blue-200"
									>
										{showExplanation ? 'Hide' : 'Show'} Explanation
									</button>
									
									{showExplanation && currentProblem.explanation && (
										<div className="bg-blue-50 p-4 rounded-lg">
											<h3 className="font-semibold mb-2">Explanation:</h3>
											<p>{currentProblem.explanation}</p>
										</div>
									)}

									<div className="flex justify-between">
										<button
											onClick={handleNextProblem}
											className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
										>
											Next Problem
										</button>
										
										<button
											onClick={handleBookmark}
											className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600"
										>
											Bookmark
										</button>
									</div>
								</div>
							)}
						</>
					) : (
						<div className="text-center py-8">
							Select a difficulty level to start!
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
