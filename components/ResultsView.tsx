import React, { useState, useEffect } from 'react';
import type { Question, IncorrectAnswer, Suggestion, QuizConfig, ImprovementSuggestion } from '../types';
import { generateSuggestions, generateImprovementSuggestions } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import SuggestionsView from './SuggestionsView';
import MathRenderer from './MathRenderer';

interface ResultsViewProps {
  quizConfig: QuizConfig;
  questions: Question[];
  userAnswers: (number | null)[];
  incorrectAnswers: IncorrectAnswer[];
  onTryAgain: () => void;
  onNewTopic: () => void;
  isLoading: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ quizConfig, questions, userAnswers, incorrectAnswers, onTryAgain, onNewTopic, isLoading }) => {
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [improvementTopics, setImprovementTopics] = useState<ImprovementSuggestion | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const score = userAnswers.reduce((acc, answer, index) => {
    return answer === questions[index].correctAnswerIndex ? acc + 1 : acc;
  }, 0);
  const percentage = Math.round((score / questions.length) * 100);

  const unattemptedQuestions = questions.filter((_, index) => userAnswers[index] === null);

  useEffect(() => {
    if (incorrectAnswers.length > 0) {
      const fetchAllSuggestions = async () => {
        setIsLoadingSuggestions(true);
        setSuggestionError(null);
        try {
          const [suggestionsResult, improvementResult] = await Promise.all([
            generateSuggestions(quizConfig, incorrectAnswers),
            generateImprovementSuggestions(quizConfig, incorrectAnswers)
          ]);
          setSuggestions(suggestionsResult);
          setImprovementTopics(improvementResult);
        } catch (error) {
          setSuggestionError(error instanceof Error ? error.message : "Could not load suggestions.");
        } finally {
          setIsLoadingSuggestions(false);
        }
      };
      fetchAllSuggestions();
    }
  }, [quizConfig, incorrectAnswers]);

  const getResultColor = () => {
      if (percentage >= 80) return 'text-green-400';
      if (percentage >= 50) return 'text-yellow-400';
      return 'text-red-400';
  }

  const QuestionReviewCard = ({ item, userAnswerIndex }: { item: Question, userAnswerIndex?: number | null }) => (
    <div className="bg-slate-900/50 p-6 rounded-lg">
        {item.sourceHint && (
            <div className="mb-3">
                <span className="inline-block bg-slate-700 text-cyan-300 text-xs font-medium px-2.5 py-1 rounded-full">
                    {item.sourceHint}
                </span>
            </div>
        )}
      <p className="text-lg font-semibold text-slate-200 mb-4">
        <MathRenderer content={item.question} />
      </p>
      <div className="space-y-2">
        {userAnswerIndex !== undefined && userAnswerIndex !== null ? (
            <p className="text-red-400">
                <span className="font-bold">Your answer: </span> 
                <MathRenderer content={item.options[userAnswerIndex]} />
            </p>
        ) : (
            userAnswerIndex === null && <p className="text-yellow-400 font-semibold">You did not attempt this question.</p>
        )}
        <p className="text-green-400">
          <span className="font-bold">Correct answer: </span>
          <MathRenderer content={item.options[item.correctAnswerIndex]} />
        </p>
        <p className="text-slate-400 mt-3 pt-3 border-t border-slate-700">
          <span className="font-bold text-cyan-400">Explanation: </span>
          <MathRenderer content={item.explanation} />
        </p>
        {item.resourceLink && item.resourceLink.url && (
          <div className="mt-4 pt-3 border-t border-slate-700">
              <h5 className="font-semibold text-slate-300 mb-1">Further Reading:</h5>
              <a 
                  href={item.resourceLink.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
              >
                  {item.resourceLink.title || 'Learn more about this concept'}
              </a>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto bg-slate-800 rounded-2xl shadow-2xl p-8 animate-fade-in">
      <h2 className="text-4xl font-extrabold text-center text-slate-100 mb-2">Quiz Complete!</h2>
      <p className="text-lg text-center text-slate-400">{quizConfig.exam} | {quizConfig.subject} | {quizConfig.level}</p>
      <p className={`text-6xl font-bold text-center my-4 ${getResultColor()}`}>{percentage}%</p>
      <p className="text-xl text-center text-slate-300 mb-10">You answered {score} out of {questions.length} questions correctly on "{quizConfig.topic}".</p>

      <div className="flex flex-col md:flex-row justify-center gap-4 mb-12">
        <button
          onClick={onTryAgain}
          disabled={isLoading}
          className="w-full md:w-auto px-8 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
        >
          {isLoading ? 'Generating...' : (incorrectAnswers.length > 0 ? 'Try a Personalized Quiz' : 'Try a Harder Quiz')}
        </button>
        <button
          onClick={onNewTopic}
          disabled={isLoading}
          className="w-full md:w-auto px-8 py-3 bg-slate-700 text-slate-200 font-bold rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300"
        >
          Start New Quiz
        </button>
      </div>

      {improvementTopics && improvementTopics.topicsToImprove.length > 0 && (
        <div className="mb-12 bg-slate-900/50 p-6 rounded-lg">
          <h3 className="text-2xl font-bold text-cyan-400 mb-4">Topics to Improve</h3>
          <p className="text-slate-400 mb-6">Based on your mistakes, here are specific areas and resources to help you study:</p>
          <ul className="space-y-4">
            {improvementTopics.topicsToImprove.map((topic, index) => (
              <li key={index} className="p-4 bg-slate-800 rounded-lg">
                <p className="font-semibold text-slate-200 text-lg">{topic.topicName}</p>
                <p className="text-sm text-slate-400 mb-3">{topic.reason}</p>
                {topic.resourceLink && topic.resourceLink.url && (
                    <a
                        href={topic.resourceLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                    >
                        <span>{topic.resourceLink.title || 'Learn more'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {(incorrectAnswers.length > 0 || unattemptedQuestions.length > 0) && (
        <div>
          <h3 className="text-3xl font-bold text-slate-100 mb-6 border-b-2 border-slate-700 pb-3">Review Your Answers</h3>
          
          {incorrectAnswers.length > 0 && (
            <div className="mb-10">
              <h4 className="text-2xl font-semibold text-red-400 mb-4">Incorrect Answers</h4>
              <div className="space-y-8">
                {incorrectAnswers.map((item, index) => (
                  <QuestionReviewCard key={`incorrect-${index}`} item={item} userAnswerIndex={item.userAnswerIndex} />
                ))}
              </div>
            </div>
          )}

          {unattemptedQuestions.length > 0 && (
            <div>
              <h4 className="text-2xl font-semibold text-yellow-400 mb-4">Unattempted Questions</h4>
              <div className="space-y-8">
                {unattemptedQuestions.map((item, index) => (
                  <QuestionReviewCard key={`unattempted-${index}`} item={item} userAnswerIndex={null} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isLoadingSuggestions && <LoadingSpinner message="Generating learning suggestions..." />}
      {suggestionError && (
            <div className="mt-8 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
              <p><strong>Oops!</strong> Could not generate suggestions at this time.</p>
               <p className="text-sm">{suggestionError}</p>
            </div>
      )}
      {suggestions && <SuggestionsView suggestions={suggestions} />}
    </div>
  );
};

export default ResultsView;