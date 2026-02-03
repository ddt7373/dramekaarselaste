import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface Verse {
    reference: string;
    text: string;
}

interface BlankWord {
    original: string;
    position: number;
    startIndex: number;
    endIndex: number;
    filled: boolean;
    userAnswer: string;
}

interface VerseComponentProps {
    verses: Verse[];
    onComplete: (score: number) => void;
    onClose: () => void;
    initialVerseIndex?: number;
}

const VerseComponent: React.FC<VerseComponentProps> = ({ verses, onComplete, onClose, initialVerseIndex = 0 }) => {
    const [currentVerseIndex, setCurrentVerseIndex] = useState(initialVerseIndex);
    const [currentRound, setCurrentRound] = useState(1);
    const [blanks, setBlanks] = useState<BlankWord[]>([]);
    const [selectedBlankIndex, setSelectedBlankIndex] = useState<number | null>(null);
    const [showOptions, setShowOptions] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalCorrect, setTotalCorrect] = useState(0);

    const TOTAL_ROUNDS = 5;
    const currentVerse = verses[currentVerseIndex];
    const progress = ((currentRound - 1) / TOTAL_ROUNDS) * 100;

    // Initialize blanks for current verse and round
    useEffect(() => {
        if (!currentVerse) return;

        const words = currentVerse.text.split(/\s+/);
        const numBlanks = Math.min(3, Math.floor(words.length / 5)); // 3 blanks per round

        // Select random words to blank
        const selectedIndices = new Set<number>();
        while (selectedIndices.size < numBlanks) {
            const randomIndex = Math.floor(Math.random() * words.length);
            // Avoid very short words
            if (words[randomIndex].length > 3) {
                selectedIndices.add(randomIndex);
            }
        }

        // Create blanks
        const newBlanks: BlankWord[] = [];
        let charIndex = 0;
        words.forEach((word, index) => {
            if (selectedIndices.has(index)) {
                newBlanks.push({
                    original: word.replace(/[.,!?;:]/g, ''), // Remove punctuation
                    position: index,
                    startIndex: charIndex,
                    endIndex: charIndex + word.length,
                    filled: false,
                    userAnswer: ''
                });
            }
            charIndex += word.length + 1; // +1 for space
        });

        setBlanks(newBlanks);
        setSelectedBlankIndex(null);
        setShowOptions(false);
        setCorrectCount(0);
    }, [currentVerse, currentRound]);

    // Generate options for a blank
    const generateOptions = (blank: BlankWord): string[] => {
        const allWords = currentVerse.text.split(/\s+/).map(w => w.replace(/[.,!?;:]/g, ''));
        const uniqueWords = Array.from(new Set(allWords)).filter(w => w.length > 3);

        // Get 3 random wrong options
        const wrongOptions = uniqueWords
            .filter(w => w !== blank.original)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        // Add correct answer and shuffle
        const opts = [...wrongOptions, blank.original].sort(() => Math.random() - 0.5);
        return opts;
    };

    // Handle blank click
    const handleBlankClick = (index: number) => {
        if (blanks[index].filled) return;

        setSelectedBlankIndex(index);
        setOptions(generateOptions(blanks[index]));
        setShowOptions(true);
    };

    // Handle option selection
    const handleOptionSelect = (option: string) => {
        if (selectedBlankIndex === null) return;

        const newBlanks = [...blanks];
        const blank = newBlanks[selectedBlankIndex];
        blank.userAnswer = option;
        blank.filled = true;

        const isCorrect = option === blank.original;
        if (isCorrect) {
            setCorrectCount(correctCount + 1);
            setTotalCorrect(totalCorrect + 1);
        }

        setBlanks(newBlanks);
        setShowOptions(false);
        setSelectedBlankIndex(null);
    };

    // Handle next round
    const handleNext = () => {
        if (currentRound < TOTAL_ROUNDS) {
            setCurrentRound(currentRound + 1);
        } else {
            // Complete
            onComplete(totalCorrect);
        }
    };

    // Render text with blanks
    const renderTextWithBlanks = () => {
        const words = currentVerse.text.split(/\s+/);

        return (
            <div className="text-lg leading-relaxed">
                {words.map((word, index) => {
                    const blank = blanks.find(b => b.position === index);

                    if (blank) {
                        const isCorrect = blank.filled && blank.userAnswer === blank.original;
                        const isWrong = blank.filled && blank.userAnswer !== blank.original;

                        return (
                            <span key={index}>
                                <button
                                    onClick={() => handleBlankClick(blanks.indexOf(blank))}
                                    disabled={blank.filled}
                                    className={`inline-block mx-1 px-3 py-1 rounded border-2 transition-all ${blank.filled
                                            ? isCorrect
                                                ? 'bg-green-100 border-green-500 text-green-800'
                                                : 'bg-red-100 border-red-500 text-red-800'
                                            : selectedBlankIndex === blanks.indexOf(blank)
                                                ? 'bg-blue-100 border-blue-500'
                                                : 'bg-gray-100 border-gray-300 hover:border-blue-400 cursor-pointer'
                                        }`}
                                >
                                    {blank.filled ? blank.userAnswer : '______'}
                                </button>
                                {' '}
                            </span>
                        );
                    }

                    return <span key={index}>{word} </span>;
                })}
            </div>
        );
    };

    const allFilled = blanks.every(b => b.filled);
    const roundScore = `${correctCount}/${blanks.length}`;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                            Bybelverse Oefening
                        </CardTitle>
                        <span className="text-sm text-gray-500">
                            Rondte {currentRound} van {TOTAL_ROUNDS}
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Verse Reference */}
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-blue-800">
                            {currentVerse.reference}
                        </h3>
                    </div>

                    {/* Verse Text with Blanks */}
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                        {renderTextWithBlanks()}
                    </div>

                    {/* Instructions */}
                    {!allFilled && (
                        <div className="text-sm text-gray-600 text-center">
                            Klik op die leë spasies en kies die korrekte woord
                        </div>
                    )}

                    {/* Options */}
                    {showOptions && selectedBlankIndex !== null && (
                        <div className="grid grid-cols-2 gap-3">
                            {options.map((option, index) => (
                                <Button
                                    key={index}
                                    onClick={() => handleOptionSelect(option)}
                                    variant="outline"
                                    className="h-auto py-3 text-base"
                                >
                                    {option}
                                </Button>
                            ))}
                        </div>
                    )}

                    {/* Score */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <span className="text-sm text-gray-600">Rondte Telling:</span>
                            <span className="ml-2 font-bold text-lg">{roundScore}</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">Totaal Korrek:</span>
                            <span className="ml-2 font-bold text-lg text-green-600">{totalCorrect}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {!allFilled ? (
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Kanselleer
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setBlanks(blanks.map(b => ({ ...b, filled: false, userAnswer: '' })));
                                        setCorrectCount(0);
                                    }}
                                    className="flex-1"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Probeer Weer
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="flex-1"
                                >
                                    {currentRound < TOTAL_ROUNDS ? 'Volgende Rondte' : 'Voltooi'}
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default VerseComponent;
