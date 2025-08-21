import React, { useState, useCallback, useEffect, useRef } from 'react';
import QuizSetup from './components/TopicSelector'; // Renamed component, but file is the same
import QuizView from './components/QuizView';
import ResultsView from './components/ResultsView';
import LoadingSpinner from './components/LoadingSpinner';
import HistoryView from './components/HistoryView';
import { generateQuiz } from './services/geminiService';
import type { Question, QuizState, IncorrectAnswer, QuizHistoryItem, QuizConfig } from './types';

const App: React.FC = () => {
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<IncorrectAnswer[]>([]);
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [error, setError] = useState<string | null>(null);

  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('quizHistory');
      if (savedHistory) {
        setQuizHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('quizHistory', JSON.stringify(quizHistory));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [quizHistory]);

  const startQuiz = useCallback(async (config: QuizConfig, isRetry: boolean = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setQuizConfig(config);
    setQuizState('loading');
    setError(null);
    setShowHistory(false);
    try {
      const generatedQuestions = await generateQuiz(config, isRetry ? incorrectAnswers : undefined);
      setQuestions(generatedQuestions);
      setUserAnswers([]);
      setIncorrectAnswers([]);
      setQuizState('active');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      setQuizState('idle');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [incorrectAnswers]);

  const handleQuizCompletion = useCallback((answers: (number | null)[]) => {
    setUserAnswers(answers);
    const incorrect = questions
      .map((q, i) => ({ ...q, userAnswerIndex: answers[i]! }))
      .filter((_, i) => answers[i] !== null && answers[i] !== questions[i].correctAnswerIndex);
    setIncorrectAnswers(incorrect);

    const score = answers.reduce((acc, answer, index) => {
        return answer === questions[index].correctAnswerIndex ? acc + 1 : acc;
    }, 0);

    if (quizConfig) {
      const newHistoryItem: QuizHistoryItem = {
        id: Date.now(),
        config: quizConfig,
        score: score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        date: Date.now(),
      };
      setQuizHistory(prevHistory => [newHistoryItem, ...prevHistory]);
    }

    setQuizState('finished');
  }, [questions, quizConfig]);
  
  const handleTryAgain = () => {
    if (quizConfig) {
      startQuiz(quizConfig, true);
    }
  };

  const handleNewTopic = () => {
    setQuizConfig(null);
    setQuestions([]);
    setUserAnswers([]);
    setIncorrectAnswers([]);
    setQuizState('idle');
    setError(null);
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire quiz history? This action cannot be undone.")) {
      setQuizHistory([]);
    }
  };
  
  const renderContent = () => {
    switch (quizState) {
      case 'loading':
        return <LoadingSpinner />;
      case 'active':
        return quizConfig && <QuizView 
                                questions={questions} 
                                onQuizComplete={handleQuizCompletion} 
                                quizConfig={quizConfig} 
                              />;
      case 'finished':
        return quizConfig && <ResultsView 
          quizConfig={quizConfig}
          questions={questions} 
          userAnswers={userAnswers}
          incorrectAnswers={incorrectAnswers}
          onTryAgain={handleTryAgain}
          onNewTopic={handleNewTopic}
          isLoading={isSubmitting}
        />;
      case 'idle':
      default:
        if (showHistory) {
          return <HistoryView 
            history={quizHistory} 
            onClearHistory={handleClearHistory}
            onGoBack={() => setShowHistory(false)}
          />;
        }
        return <QuizSetup 
            onStartQuiz={(config) => startQuiz(config)} 
            isLoading={isSubmitting}
            onShowHistory={() => setShowHistory(true)}
        />;
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-900 to-gray-900 font-sans">
        <div className="w-full max-w-7xl mx-auto">
            {error && (
                <div className="max-w-xl mx-auto bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-center" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            {renderContent()}
        </div>
        <footer className="text-center text-slate-500 mt-8">
            <p>Powered by Gemini. Built for adaptive learning for JEE & NEET.</p>
        </footer>
    </main>
  );
};

export default App;