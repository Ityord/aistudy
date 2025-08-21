import React, { useState, useEffect, useRef } from 'react';
import type { Question, QuizConfig, DifficultyLevel } from '../types';
import MathRenderer from './MathRenderer';

interface QuizViewProps {
  questions: Question[];
  onQuizComplete: (answers: (number | null)[]) => void;
  quizConfig: QuizConfig;
}

const getTimeLimit = (level: DifficultyLevel): number => {
  switch (level) {
    case 'Level 1: Advanced':
      return 60 * 60; // 60 minutes
    case 'Level 3: Boards':
      return 60 * 60; // 60 minutes
    case 'Level 2: Mains/NEET':
      return 45 * 60; // 45 minutes
    default:
      return 45 * 60; // Fallback
  }
};

const formatTime = (seconds: number): string => {
  if (seconds < 0) seconds = 0;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const QuizView: React.FC<QuizViewProps> = ({ questions, onQuizComplete, quizConfig }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [currentSelection, setCurrentSelection] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLimit(quizConfig.level));

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const onQuizCompleteRef = useRef(onQuizComplete);
  useEffect(() => {
    onQuizCompleteRef.current = onQuizComplete;
  });

  const answersRef = useRef({ selectedAnswers, currentSelection, currentQuestionIndex });
  useEffect(() => {
    answersRef.current = { selectedAnswers, currentSelection, currentQuestionIndex };
  });

  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          const { selectedAnswers, currentQuestionIndex, currentSelection } = answersRef.current;
          const finalAnswers = [...selectedAnswers];
          finalAnswers[currentQuestionIndex] = currentSelection;
          onQuizCompleteRef.current(finalAnswers);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
      setCurrentSelection(selectedAnswers[currentQuestionIndex]);
  }, [currentQuestionIndex, selectedAnswers]);

  const handleOptionSelect = (optionIndex: number) => {
    setCurrentSelection(optionIndex);
  };
  
  const saveCurrentAnswer = () => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = currentSelection;
    setSelectedAnswers(newAnswers);
    return newAnswers;
  };

  const handleNext = () => {
    const newAnswers = saveCurrentAnswer();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onQuizCompleteRef.current(newAnswers);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      saveCurrentAnswer();
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleEndQuiz = () => {
    if (window.confirm("Are you sure you want to end the quiz? Your current progress will be submitted.")) {
        const finalAnswers = saveCurrentAnswer();
        onQuizCompleteRef.current(finalAnswers);
    }
  };
  
  const timerColor = timeLeft < 300 
    ? 'text-red-400 bg-red-900/50 animate-pulse' 
    : 'text-slate-300 bg-slate-700/50';

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-800 rounded-2xl shadow-2xl p-8 animate-fade-in">
      {/* Header with Progress and Timer */}
      <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-cyan-400">Question {currentQuestionIndex + 1} / {questions.length}</span>
            <div className="flex items-center gap-4">
              <div className={`flex items-center text-lg font-bold font-mono px-3 py-1 rounded-md transition-colors ${timerColor}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatTime(timeLeft)}</span>
              </div>
              <button onClick={handleEndQuiz} className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-500 transition-colors">
                End Quiz
              </button>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-100 leading-tight">
          <MathRenderer content={currentQuestion.question} />
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionSelect(index)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-lg
              ${currentSelection === index 
                ? 'bg-cyan-500 border-cyan-400 text-white font-bold shadow-lg scale-105'
                : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-cyan-500'
              }`}
          >
            <span className="mr-3 font-mono">{String.fromCharCode(65 + index)}.</span>
            <MathRenderer content={option} />
          </button>
        ))}
      </div>
      
      {/* Navigation */}
      <div className="mt-10 flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 bg-slate-700 text-slate-200 font-bold rounded-lg hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-500 transition-all"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transition-all duration-300 transform hover:translate-y-[-2px] shadow-lg"
        >
          {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish Quiz'}
        </button>
      </div>
    </div>
  );
};

export default QuizView;