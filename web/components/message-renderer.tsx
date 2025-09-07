'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MessageRendererProps {
  content: string;
  className?: string;
}

export function MessageRenderer({ content, className = '' }: MessageRendererProps) {
  // Process the content to handle <latex> tags
  const processedContent = React.useMemo(() => {
    // Replace <latex>...</latex> with proper math delimiters
    return content.replace(/<latex>([\s\S]*?)<\/latex>/g, (match, mathContent) => {
      // Clean up the LaTeX content - remove extra whitespace and newlines
      const cleanMath = mathContent.trim();
      // Use block math delimiters for LaTeX content
      return `$$${cleanMath}$$`;
    });
  }, [content]);

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Customize paragraph rendering to handle line breaks properly
          p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
          // Customize code rendering
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-xs font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-xs font-mono" {...props}>
                {children}
              </code>
            );
          },
          // Customize blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">
              {children}
            </blockquote>
          ),
          // Customize lists
          ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          // Customize headers
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
          // Customize emphasis
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}