import React, { useState } from 'react';
import type { Exam, Subject, DifficultyLevel, QuizConfig } from '../types';

interface QuizSetupProps {
  onStartQuiz: (config: QuizConfig) => void;
  onShowHistory: () => void;
  isLoading: boolean;
}

const subjectsConfig: { [key in Exam]: Subject[] } = {
  JEE: ['Physics', 'Chemistry', 'Maths'],
  NEET: ['Physics', 'Chemistry', 'Biology'],
};

const difficultyLevels: DifficultyLevel[] = ['Level 3: Boards', 'Level 2: Mains/NEET', 'Level 1: Advanced'];

const QuizSetup: React.FC<QuizSetupProps> = ({ onStartQuiz, onShowHistory, isLoading }) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<DifficultyLevel | null>(null);
  const [isMergingTopics, setIsMergingTopics] = useState(false);
  const [mergeTopic, setMergeTopic] = useState('');
  const [error, setError] = useState('');

  const handleStart = () => {
    if (!exam || !subject || !topic.trim() || !level) {
      setError('Please complete all steps before starting the quiz.');
      return;
    }
    if (isMergingTopics && !mergeTopic.trim()) {
      setError('Please enter the second topic to merge or disable the option.');
      return;
    }
    setError('');
    
    const config: QuizConfig = { exam, subject, topic, level };
    if (isMergingTopics && mergeTopic.trim()) {
        config.mergeTopic = mergeTopic.trim();
    }
    onStartQuiz(config);
  };

  const handleStartRevisionQuiz = () => {
    if (!exam || !subject || !level) {
      setError('Please select an exam, subject, and difficulty level for the revision quiz.');
      return;
    }
    setError('');
    const config: QuizConfig = { exam, subject, topic: 'Foundational Concepts', level };
    onStartQuiz(config);
  };

  const renderStep = (stepNumber: number, title: string, isComplete: boolean, content: React.ReactNode) => (
    <div className={`bg-slate-900/50 p-6 rounded-lg border-l-4 ${isComplete ? 'border-cyan-500' : 'border-slate-700'} transition-colors`}>
      <h3 className="text-xl font-semibold text-slate-100 mb-4">
        <span className={`mr-3 inline-flex items-center justify-center w-8 h-8 rounded-full ${isComplete ? 'bg-cyan-500' : 'bg-slate-700'}`}>{stepNumber}</span>
        {title}
      </h3>
      {content}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-800 rounded-2xl shadow-2xl p-8">
       <div className="flex justify-between items-center mb-8">
            <div className="text-left">
              <h2 className="text-3xl font-bold text-cyan-400">Quiz Setup</h2>
              <p className="text-slate-400">Tailor your quiz for JEE or NEET preparation.</p>
            </div>
            <button 
                onClick={onShowHistory}
                className="p-2 rounded-full hover:bg-slate-700 transition-colors"
                aria-label="View quiz history"
                title="View quiz history"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
        </div>

      <div className="space-y-6">
        {renderStep(1, "Choose Your Exam", !!exam, (
          <div className="grid grid-cols-2 gap-4">
            {(['JEE', 'NEET'] as Exam[]).map(e => (
              <button key={e} onClick={() => { setExam(e); setSubject(null); }} disabled={isLoading} className={`p-4 font-bold rounded-lg transition-all ${exam === e ? 'bg-cyan-600 text-white ring-2 ring-cyan-400' : 'bg-slate-700 hover:bg-slate-600'}`}>
                {e}
              </button>
            ))}
          </div>
        ))}

        {exam && renderStep(2, "Select Subject", !!subject, (
          <div className="flex flex-wrap gap-3">
            {subjectsConfig[exam].map(s => (
              <button key={s} onClick={() => setSubject(s)} disabled={isLoading} className={`px-4 py-2 rounded-lg transition-all ${subject === s ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>
                {s}
              </button>
            ))}
          </div>
        ))}
        
        {subject && renderStep(3, "Enter Topic or Choose Revision", topic.trim() !== '' || false, (
            <div className="space-y-4">
                <p className="text-slate-300">Enter a specific topic for a focused quiz:</p>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={`e.g., 'Rotational Motion' in ${subject}`}
                  className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  disabled={isLoading}
                />
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={isMergingTopics} onChange={(e) => setIsMergingTopics(e.target.checked)} className="form-checkbox h-5 w-5 bg-slate-600 border-slate-500 rounded text-cyan-500 focus:ring-cyan-600" />
                    <span>Merge another topic for multi-concept questions?</span>
                </label>
                {isMergingTopics && (
                    <input
                      type="text"
                      value={mergeTopic}
                      onChange={(e) => setMergeTopic(e.target.value)}
                      placeholder="e.g., 'Work, Power, Energy'"
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all animate-fade-in"
                      disabled={isLoading}
                    />
                )}
                 <div className="flex items-center gap-4 my-4">
                    <hr className="flex-grow border-slate-600"/>
                    <span className="text-slate-400 font-semibold">OR</span>
                    <hr className="flex-grow border-slate-600"/>
                </div>
                 <button onClick={handleStartRevisionQuiz} disabled={isLoading || !level} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                    Start Foundational Revision Quiz
                </button>
            </div>
        ))}

        {exam && subject && renderStep(4, "Select Difficulty", !!level, (
            <div className="flex flex-col sm:flex-row gap-3">
                {difficultyLevels.map(l => (
                    <button key={l} onClick={() => setLevel(l)} disabled={isLoading} className={`flex-1 text-sm sm:text-base px-4 py-2 rounded-lg transition-all ${level === l ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>
                        {l}
                    </button>
                ))}
            </div>
        ))}
      </div>
      
      <div className="mt-8">
        {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
        <button
          onClick={handleStart}
          disabled={isLoading || !exam || !subject || !topic.trim() || !level}
          className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:translate-y-[-2px] shadow-lg"
        >
          {isLoading ? 'Generating...' : 'Start Focused Quiz'}
        </button>
      </div>
    </div>
  );
};

export default QuizSetup;