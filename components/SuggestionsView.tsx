import React from 'react';
import type { Suggestion } from '../types';

interface SuggestionsViewProps {
  suggestions: Suggestion;
}

const SuggestionsView: React.FC<SuggestionsViewProps> = ({ suggestions }) => {
  return (
    <div className="mt-12 bg-slate-900/50 p-6 rounded-lg animate-fade-in">
      <h3 className="text-2xl font-bold text-cyan-400 mb-6 border-b-2 border-slate-700 pb-2">
        Personalized Learning Suggestions
      </h3>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-xl font-semibold text-slate-100 mb-4">📚 Recommended Books</h4>
          {suggestions.books && suggestions.books.length > 0 ? (
            <ul className="space-y-4">
              {suggestions.books.map((book, index) => (
                <li key={index} className="bg-slate-800 p-4 rounded-md">
                  <p className="font-bold text-slate-200">{book.title}</p>
                  <p className="text-sm text-slate-400 mb-2">by {book.author}</p>
                  <p className="text-slate-300">{book.shortDescription}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400">No book recommendations available right now.</p>
          )}
        </div>
        
        <div>
          <h4 className="text-xl font-semibold text-slate-100 mb-4">📺 Recommended Videos</h4>
          {suggestions.youtube && suggestions.youtube.length > 0 ? (
            <ul className="space-y-4">
              {suggestions.youtube.map((video, index) => (
                <li key={index} className="bg-slate-800 p-4 rounded-md">
                  <a href={video.link} target="_blank" rel="noopener noreferrer" className="font-bold text-cyan-400 hover:underline">
                    {video.title}
                  </a>
                  <p className="text-sm text-slate-400">on {video.channel}</p>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-slate-400">No video recommendations available right now.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionsView;
