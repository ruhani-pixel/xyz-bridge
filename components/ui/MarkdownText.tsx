'use client';

import React from 'react';

interface MarkdownTextProps {
  content: string;
  className?: string;
}

/**
 * A ultra-lightweight and safe 'Markdown' renderer for AI responses.
 * Handles:
 * - Bold: **text**
 * - Italic: *text* or _text_
 * - Line breaks: \n
 */
export function MarkdownText({ content, className }: MarkdownTextProps) {
  if (!content) return null;

  // Split by line breaks first
  const paragraphs = content.split('\n');

  return (
    <div className={className}>
      {paragraphs.map((line, pIdx) => {
        // Handle bold and italics within each line
        // Regex to match **bold**, *italic*, _italic_
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|_.*?_)/g);

        return (
          <p key={pIdx} className={line.trim() === '' ? 'h-2' : 'min-h-[1em]'}>
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
              }
              if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
                return <em key={i} className="italic font-medium">{part.slice(1, -1)}</em>;
              }
              return <span key={i}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}
