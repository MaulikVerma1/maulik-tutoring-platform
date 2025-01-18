import { NextResponse } from 'next/server';



// Shuffle function to randomize answer choices
function shuffleArray<T>(array: T[]): { shuffled: T[], correctIndex: number } {
	const shuffled = [...array];
	let correctIndex = 0; // This will track where our first element ends up
	
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		
		// Track where our original first element (correct answer) goes
		if (j === 0) correctIndex = i;
		if (i === 0) correctIndex = j;
	}
	
	return { shuffled, correctIndex };
}

function generateMathProblem(difficulty: string) {
	// Helper function to generate random rational number
	const generateRational = (max: number = 10): string => {
		const numerator = Math.floor(Math.random() * max) + 1;
		const denominator = Math.floor(Math.random() * max) + 1;
		return `${numerator}/${denominator}`;
	};

	// Helper function to generate random integer
	const generateInteger = (min: number, max: number): number => {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	// Helper function for generating fractions
	const generateFraction = (): { numerator: number; denominator: number } => {
		const numerator = Math.floor(Math.random() * 10) + 1;
		const denominator = Math.floor(Math.random() * 10) + 1;
		return { numerator, denominator };
	};

	// Helper function to format fractions as strings
	const formatFraction = (numerator: number, denominator: number): string => {
		if (denominator === 1) return numerator.toString();
		return `${numerator}/${denominator}`;
	};

	// Add new helper function for hard problems
	const generateHardProblem = () => {
		const problemTypes = [
			// Type 1: Mixture problems
			() => {
				const solution1Percent = generateInteger(20, 40);
				const solution2Percent = generateInteger(60, 80);
				const finalPercent = generateInteger(solution1Percent + 5, solution2Percent - 5);
				const totalVolume = generateInteger(100, 500);
				
				const question = `A chemist needs to create ${totalVolume}mL of a ${finalPercent}% solution using two existing solutions: one ${solution1Percent}% and one ${solution2Percent}%. How many mL of the ${solution1Percent}% solution should be used?`;
				
				// Calculate using mixture problems formula: (C₁V₁ + C₂V₂ = CₜVₜ)
				const v1 = Math.round(totalVolume * (finalPercent - solution2Percent) / (solution1Percent - solution2Percent));
				const correctAnswer = v1;
				
				const choices = [
					correctAnswer,
					Math.round(correctAnswer * 0.8),
					Math.round(correctAnswer * 1.2),
					Math.round(totalVolume - correctAnswer)
				].map(String);
				
				return {
					question,
					choices,
					correctAnswer: 0,
					explanation: `1. Use the mixture formula: (${solution1Percent}%)V₁ + ${solution2Percent}%(${totalVolume}-V₁) = ${finalPercent}%(${totalVolume})\n` +
											`2. Solve for V₁: ${solution1Percent}V₁ + ${solution2Percent}(${totalVolume}-V₁) = ${finalPercent}(${totalVolume})\n` +
											`3. Simplify: V₁ = ${correctAnswer}mL of the ${solution1Percent}% solution`
				};
			},
			// Type 2: Work rate problems
			() => {
				const worker1Rate = generateRational(8); // time to complete alone
				const worker2Rate = generateRational(6);
				const totalWork = generateInteger(24, 48);
				
				const question = `Worker A can complete a job in ${worker1Rate} hours working alone. Worker B can complete the same job in ${worker2Rate} hours. If they work together, how many hours will it take to complete ${totalWork} units of the same work?`;
				
				// Calculate combined rate and total time
				const rate1 = eval(`1/${worker1Rate}`);
				const rate2 = eval(`1/${worker2Rate}`);
				const combinedRate = rate1 + rate2;
				const totalTime = Math.round((totalWork / combinedRate) * 100) / 100;
				
				const choices = [
					totalTime.toFixed(2),
					(totalTime * 1.5).toFixed(2),
					(totalTime * 0.75).toFixed(2),
					(totalWork / ((1/eval(worker1Rate)) * (1/eval(worker2Rate)))).toFixed(2)
				];
				
				return {
					question,
					choices,
					correctAnswer: 0,
					explanation: `1. Convert individual rates to units/hour: A=${rate1.toFixed(2)}, B=${rate2.toFixed(2)}\n` +
											`2. Combined rate = ${rate1.toFixed(2)} + ${rate2.toFixed(2)} = ${combinedRate.toFixed(2)} units/hour\n` +
											`3. Time = ${totalWork} units ÷ ${combinedRate.toFixed(2)} units/hour = ${totalTime} hours`
				};
			},
			// Type 3: Complex ratio problems
			() => {
				const ratio1 = generateInteger(2, 5);
				const ratio2 = generateInteger(3, 6);
				const ratio3 = generateInteger(4, 7);
				const total = generateInteger(120, 360);
				
				const question = `In a school, the ratio of science students to math students to arts students is ${ratio1}:${ratio2}:${ratio3}. ` +
											`If there are ${total} students in total, how many science students are there?`;
				
				const sum = ratio1 + ratio2 + ratio3;
				const scienceStudents = Math.round(total * ratio1 / sum);
				
				const choices = [
					scienceStudents.toString(),
					Math.round(total * ratio2 / sum).toString(),
					Math.round(total * ratio3 / sum).toString(),
					Math.round(total / 3).toString()
				];
				
				return {
					question,
					choices,
					correctAnswer: 0,
					explanation: `1. Total ratio parts = ${ratio1} + ${ratio2} + ${ratio3} = ${sum}\n` +
											`2. Each part = ${total} ÷ ${sum} = ${total/sum}\n` +
											`3. Science students = ${ratio1} × ${total/sum} = ${scienceStudents}`
				};
			}
		];

		const selectedProblem = problemTypes[Math.floor(Math.random() * problemTypes.length)]();
		const { shuffled, correctIndex } = shuffleArray(selectedProblem.choices);
		
		return {
			...selectedProblem,
			choices: shuffled,
			correctAnswer: correctIndex
		};
	};

	let question, choices, correctAnswer, explanation;

	switch (difficulty) {
		case 'easy':
			// Rational number arithmetic
			const num1 = generateRational();
			const num2 = generateRational();
			const basicOperations = ['+', '-', '×', '÷'];
			const operation = basicOperations[Math.floor(Math.random() * basicOperations.length)];
			
			question = `Calculate: ${num1} ${operation} ${num2}`;
			
			// Generate answer and variations for choices
			const easyResult = eval(`(${num1}) ${operation === '×' ? '*' : operation} (${num2})`);
			const formattedResult = easyResult.toFixed(2);
			
			choices = [
				formattedResult,
				(easyResult + 0.5).toFixed(2),
				(easyResult - 0.5).toFixed(2),
				(easyResult * 1.5).toFixed(2)
			];
			const { shuffled: shuffledEasyChoices, correctIndex: easyIndex } = shuffleArray(choices);
			choices = shuffledEasyChoices;
			correctAnswer = easyIndex;
			explanation = `To solve ${num1} ${operation} ${num2}:\n1. Convert fractions to decimals\n2. Perform the ${operation} operation\n3. Result = ${formattedResult}`;
			break;

		case 'medium':
			// PEMDAS with fractions
			const fraction1 = generateFraction();
			const fraction2 = generateFraction();
			const fraction3 = generateFraction();
			const num = Math.floor(Math.random() * 5) + 1;
			
			// Create expression with fractions and PEMDAS
			const pemdasExpressions = [
				{
					expr: `${formatFraction(fraction1.numerator, fraction1.denominator)} × (${formatFraction(fraction2.numerator, fraction2.denominator)} + ${num}) - ${formatFraction(fraction3.numerator, fraction3.denominator)}`,
					solve: () => {
						const f2PlusNum = (fraction2.numerator/fraction2.denominator + num);
						const f1TimesSum = (fraction1.numerator/fraction1.denominator) * f2PlusNum;
						return f1TimesSum - (fraction3.numerator/fraction3.denominator);
					}
				},
				{
					expr: `(${formatFraction(fraction1.numerator, fraction1.denominator)} + ${formatFraction(fraction2.numerator, fraction2.denominator)}) × ${num} ÷ ${formatFraction(fraction3.numerator, fraction3.denominator)}`,
					solve: () => {
						const sumFractions = (fraction1.numerator/fraction1.denominator + fraction2.numerator/fraction2.denominator);
						return (sumFractions * num) / (fraction3.numerator/fraction3.denominator);
					}
				}
			];

			const selectedExpression = pemdasExpressions[Math.floor(Math.random() * pemdasExpressions.length)];
			const mediumResult = selectedExpression.solve();
			
			question = `Solve using order of operations (PEMDAS): ${selectedExpression.expr}`;
			choices = [
				mediumResult.toFixed(2),
				(mediumResult * 1.5).toFixed(2),
				(mediumResult * 0.75).toFixed(2),
				(mediumResult + 2).toFixed(2)
			];
			
			const { shuffled: shuffledMediumChoices, correctIndex: medIndex } = shuffleArray(choices);
			choices = shuffledMediumChoices;
			correctAnswer = medIndex;
			
			explanation = `Following PEMDAS:\n1. First solve parentheses\n2. Then multiplication/division from left to right\n3. Finally addition/subtraction from left to right\nResult = ${mediumResult.toFixed(2)}`;
			break;

		case 'hard':
			const hardProblem = generateHardProblem();
			return {
				question: hardProblem.question,
				choices: hardProblem.choices,
				correctAnswer: hardProblem.correctAnswer,
				explanation: hardProblem.explanation,
				difficulty
			};


		default:
			throw new Error('Invalid difficulty level');
	}

	return {
		question,
		choices,
		correctAnswer,
		explanation,
		difficulty
	};
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const difficulty = searchParams.get('difficulty') || 'medium';
		
		const problem = generateMathProblem(difficulty);
		return NextResponse.json(problem);
	} catch (error) {
		console.error('Error generating math problem:', error);
		return NextResponse.json(
			{ error: 'Failed to generate math problem' },
			{ status: 500 }
		);
	}
}
