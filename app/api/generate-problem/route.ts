import { NextResponse } from 'next/server';



function generateSlopeProblem(difficulty: string) {
	// Helper function to format equation nicely
	const formatEquation = (slope: number, yIntercept: number): string => {
		const sign = yIntercept >= 0 ? '+' : '';
		return `y = ${slope}x${sign}${yIntercept}`;
	};

	// Helper function to ensure unique choices
	const generateUniqueChoices = (correctAnswer: string, slope: number, yInt: number): string[] => {
		const choices = new Set<string>();
		choices.add(correctAnswer);
		
		while (choices.size < 4) {
			const randomModifier = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
			const randomYInt = Math.floor(Math.random() * 5) - 2; // -2 to 2
			
			const newSlope = slope + randomModifier;
			const newYInt = yInt + randomYInt;
			
			const newChoice = formatEquation(newSlope, newYInt);
			if (newChoice !== correctAnswer && !choices.has(newChoice)) {
				choices.add(newChoice);
			}
		}
		
		return Array.from(choices);
	};

	const points = {
		x1: Math.floor(Math.random() * 6) - 3,
		y1: Math.floor(Math.random() * 6) - 3,
		slope: Math.floor(Math.random() * 4) + 1,
		x2: 0,
		y2: 0
	};
	points.x2 = points.x1 + 1;
	points.y2 = points.y1 + points.slope;
	const yIntercept = points.y1 - points.slope * points.x1;

	let question, choices, correctAnswer, explanation;

	switch (difficulty) {
		case 'easy':
			question = `Find the slope between points (${points.x1}, ${points.y1}) and (${points.x2}, ${points.y2}).`;
			const correctSlope = points.slope;
			choices = [correctSlope.toString()];
			while (choices.length < 4) {
				const newChoice = (correctSlope + (Math.floor(Math.random() * 5) - 2)).toString();
				if (!choices.includes(newChoice)) {
					choices.push(newChoice);
				}
			}
			correctAnswer = 0;
			explanation = `Using the slope formula: (y₂-y₁)/(x₂-x₁) = (${points.y2}-${points.y1})/(${points.x2}-${points.x1}) = ${correctSlope}`;
			break;

		case 'medium':
			const correctEq = formatEquation(points.slope, yIntercept);
			choices = generateUniqueChoices(correctEq, points.slope, yIntercept);
			correctAnswer = choices.indexOf(correctEq);
			question = `Find the equation of the line passing through (${points.x1}, ${points.y1}) and (${points.x2}, ${points.y2}) in slope-intercept form.`;
			explanation = `1. Find slope: m = (${points.y2}-${points.y1})/(${points.x2}-${points.x1}) = ${points.slope}\n2. Use point-slope form: y - ${points.y1} = ${points.slope}(x - ${points.x1})\n3. Solve for y: ${correctEq}`;
			break;

		case 'hard':
			const perpSlope = -1/points.slope;
			const perpYInt = points.y1 - perpSlope * points.x1;
			const perpEq = formatEquation(perpSlope, perpYInt);
			choices = generateUniqueChoices(perpEq, perpSlope, perpYInt);
			correctAnswer = choices.indexOf(perpEq);
			question = `Find the equation of the line perpendicular to y = ${points.slope}x + ${yIntercept} passing through (${points.x1}, ${points.y1}).`;
			explanation = `1. Perpendicular slopes are negative reciprocals: -1/${points.slope} = ${perpSlope}\n2. Use point-slope form with (${points.x1}, ${points.y1})\n3. Solve for y: ${perpEq}`;
			break;

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
		
		const problem = generateSlopeProblem(difficulty);
		return NextResponse.json(problem);
	} catch (error) {
		console.error('Error generating math problem:', error);
		return NextResponse.json(
			{ error: 'Failed to generate math problem' },
			{ status: 500 }
		);
	}
}
