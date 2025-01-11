'use client'

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { logOut } from '../../lib/firebase';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export default function QuizPage() {
  const auth = useAuth();
  const loading = auth?.loading ?? true;
  const currentUser = auth?.currentUser ?? null;
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/');
    } else if (currentUser) {
      fetchQuestion();
    }
  }, [currentUser, loading, router]);

  const fetchQuestion = async () => {
    const response = await fetch('/api/generate-question');
    const data = await response.json();
    setQuestion(data);
    setSelectedAnswer('');
    setResult('');
  };

  const handleSubmit = () => {
    if (question && selectedAnswer === question.correctAnswer) {
      setResult('Correct!');
    } else {
      setResult('Incorrect. Try again!');
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Math Quiz</CardTitle>
          <CardDescription>Test your math skills!</CardDescription>
        </CardHeader>
        <CardContent>
          {question && (
            <div className="space-y-4">
              <p className="text-lg font-semibold">{question.question}</p>
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button onClick={handleSubmit} className="w-full">Submit Answer</Button>
          {result && <p className={result === 'Correct!' ? 'text-green-500' : 'text-red-500'}>{result}</p>}
          <Button onClick={fetchQuestion} variant="outline" className="w-full">Next Question</Button>
          <Button onClick={handleLogout} variant="ghost" className="w-full">Log Out</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

