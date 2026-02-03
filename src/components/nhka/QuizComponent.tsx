import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

interface QuizComponentProps {
    questions: QuizQuestion[];
    onComplete: (score: number) => void;
    onClose: () => void;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ questions, onComplete, onClose }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(new Array(questions.length).fill(false));

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const handleAnswerSelect = (index: number) => {
        if (showFeedback) return; // Don't allow changing answer after feedback
        setSelectedAnswer(index);
    };

    const handleSubmitAnswer = () => {
        if (selectedAnswer === null) return;

        setShowFeedback(true);

        // Check if correct
        const isCorrect = selectedAnswer === currentQuestion.correctIndex;
        if (isCorrect) {
            setScore(score + 1);
        }

        // Mark as answered
        const newAnswered = [...answeredQuestions];
        newAnswered[currentQuestionIndex] = true;
        setAnsweredQuestions(newAnswered);
    };

    const handleNextQuestion = () => {
        if (isLastQuestion) {
            // Quiz complete
            onComplete(score + (selectedAnswer === currentQuestion.correctIndex ? 1 : 0));
        } else {
            // Move to next question
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
            setShowFeedback(false);
        }
    };

    const getOptionClassName = (index: number) => {
        const baseClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200";

        if (!showFeedback) {
            // Before submitting
            if (selectedAnswer === index) {
                return `${baseClass} border-blue-500 bg-blue-50`;
            }
            return `${baseClass} border-gray-200 hover:border-blue-300 hover:bg-blue-50`;
        } else {
            // After submitting - show correct/incorrect
            if (index === currentQuestion.correctIndex) {
                return `${baseClass} border-green-500 bg-green-50`;
            }
            if (selectedAnswer === index && index !== currentQuestion.correctIndex) {
                return `${baseClass} border-red-500 bg-red-50`;
            }
            return `${baseClass} border-gray-200 opacity-50`;
        }
    };

    const getOptionIcon = (index: number) => {
        if (!showFeedback) return null;

        if (index === currentQuestion.correctIndex) {
            return <CheckCircle2 className="w-5 h-5 text-green-600" />;
        }
        if (selectedAnswer === index && index !== currentQuestion.correctIndex) {
            return <XCircle className="w-5 h-5 text-red-600" />;
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                        <CardTitle>Quiz 📝</CardTitle>
                        <span className="text-sm text-gray-500">
                            Vraag {currentQuestionIndex + 1} van {questions.length}
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Question */}
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {currentQuestion.question}
                        </h3>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                disabled={showFeedback}
                                className={getOptionClassName(index)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${selectedAnswer === index && !showFeedback
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <span className="text-left">{option}</span>
                                    </div>
                                    {getOptionIcon(index)}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Feedback */}
                    {showFeedback && (
                        <div className={`p-4 rounded-lg ${selectedAnswer === currentQuestion.correctIndex
                                ? 'bg-green-50 border-2 border-green-200'
                                : 'bg-red-50 border-2 border-red-200'
                            }`}>
                            <p className={`font-semibold ${selectedAnswer === currentQuestion.correctIndex
                                    ? 'text-green-800'
                                    : 'text-red-800'
                                }`}>
                                {selectedAnswer === currentQuestion.correctIndex
                                    ? '✅ Korrek! Baie goed!'
                                    : '❌ Jammer, dit is nie korrek nie.'}
                            </p>
                            {selectedAnswer !== currentQuestion.correctIndex && (
                                <p className="text-sm text-gray-700 mt-2">
                                    Die korrekte antwoord is: <strong>{String.fromCharCode(65 + currentQuestion.correctIndex)}</strong>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        {!showFeedback ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1"
                                >
                                    Kanselleer
                                </Button>
                                <Button
                                    onClick={handleSubmitAnswer}
                                    disabled={selectedAnswer === null}
                                    className="flex-1"
                                >
                                    Dien In
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={handleNextQuestion}
                                className="w-full"
                            >
                                {isLastQuestion ? 'Voltooi Quiz' : 'Volgende Vraag'}
                            </Button>
                        )}
                    </div>

                    {/* Score */}
                    <div className="text-center text-sm text-gray-600">
                        Huidige Telling: <strong>{score}</strong> / {answeredQuestions.filter(a => a).length}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default QuizComponent;
