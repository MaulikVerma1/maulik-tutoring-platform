import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDaYZtRgro7aoYKHqQLQ_bdemAuVKW5FQI");

export async function GET() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Generate a simple math question with 4 multiple-choice answers. 
    Return the response in the following JSON format:
    {
      "question": "The math question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The correct option"
    }`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const questionData = JSON.parse(text);

    return new Response(JSON.stringify(questionData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating question:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate question' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

