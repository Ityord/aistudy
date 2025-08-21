import React from 'react';
import type { QuizHistoryItem } from '../types';

interface HistoryViewProps {
  history: QuizHistoryItem[];
  onClearHistory: () => void;
  onGoBack: () => void;
}

const formatDate = (date: number) => {
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const HistoryView: React.FC<HistoryViewProps> = ({ history, onClearHistory, onGoBack }) => {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-800 rounded-2xl shadow-2xl p-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6 border-b-2 border-slate-700 pb-4">
        <h2 className="text-3xl font-bold text-cyan-400">Quiz History</h2>
        <div>
          <button
            onClick={onGoBack}
            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors duration-200 mr-2"
          >
            New Quiz
          </button>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition-colors duration-200"
            >
              Clear History
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <p className="text-center text-slate-400 py-10">You haven't completed any quizzes yet. Start a new one to see your progress!</p>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {history.map((item) => (
            <div key={item.id} className="bg-slate-900/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center">
              <div className="mb-3 sm:mb-0">
                <h3 className="text-xl font-semibold text-slate-100">{item.config.topic}</h3>
                <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-400 mt-1">
                    <span className="font-bold text-cyan-400">{item.config.exam}</span>
                    <span>{item.config.subject}</span>
                    <span className="bg-slate-700 px-2 py-0.5 rounded">{item.config.level}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">{formatDate(item.date)}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className={`text-2xl font-bold ${getScoreColor(item.percentage)}`}>
                  {item.percentage}%
                </p>
                <p className="text-sm text-slate-300">
                  ({item.score}/{item.totalQuestions} correct)
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;