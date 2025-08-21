import React from 'react';
import Katex from 'react-katex';

// Note: The esm.sh CDN wraps the 'react-katex' named exports in a default export.
// We destructure them here to use them as intended.
const { InlineMath, BlockMath } = Katex;

interface MathRendererProps {
  content: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  if (typeof content !== 'string' || !content) {
    return null;
  }

  // Regex to split the string by KaTeX delimiters, keeping the delimiters
  // This handles both inline ($...$) and block ($$...$$) math.
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Block math: remove delimiters and render
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline math: remove delimiters and render
          return <InlineMath key={index} math={part.slice(1, -1)} />;
        } else {
          // Regular text
          return <span key={index}>{part}</span>;
        }
      })}
    </>
  );
};

export default MathRenderer;