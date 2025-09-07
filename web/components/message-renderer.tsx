'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';

interface MessageRendererProps {
  content: string;
  className?: string;
}

export function MessageRenderer({ content, className }: MessageRendererProps) {
  const [processedContent, setProcessedContent] = useState<string>(content);
  const [latexFormulas, setLatexFormulas] = useState<string[]>([]);

  useEffect(() => {
    // Extract LaTeX sections and prepare content for rendering
    const regex = /<latex>([\s\S]*?)<\/latex>/g;
    const formulas: string[] = [];
    let match;
    let tempContent = content;

    // Extract all LaTeX formulas
    while ((match = regex.exec(content)) !== null) {
      formulas.push(match[1].trim());
    }

    // Remove LaTeX sections from the main content
    if (formulas.length > 0) {
      tempContent = content.replace(regex, '');
    }

    setProcessedContent(tempContent);
    setLatexFormulas(formulas);
  }, [content]);

  return (
    <div className={cn('prose max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Override heading sizes to make them more appropriate for chat
          h1: ({ ...props }) => <h2 className="text-xl font-bold mt-4 mb-2" {...props} />,
          h2: ({ ...props }) => <h3 className="text-lg font-bold mt-3 mb-2" {...props} />,
          h3: ({ ...props }) => <h4 className="text-base font-bold mt-2 mb-1" {...props} />,
          // Make lists more compact
          ul: ({ ...props }) => <ul className="pl-6 my-2" {...props} />,
          ol: ({ ...props }) => <ol className="pl-6 my-2" {...props} />,
          // Make code blocks stand out
          code: ({ children, className, ...props }) => {
            // Check if this is a code block (has className with language) or inline code
            const isCodeBlock = className && className.startsWith('language-');
            return isCodeBlock ? (
              <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm overflow-x-auto" {...props}>
                {children}
              </code>
            ) : (
              <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>

      {/* Render LaTeX formulas if present */}
      {latexFormulas.length > 0 && (
        <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          {latexFormulas.map((formula, index) => (
            <div key={index} className="my-2 py-1 overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {`$${formula}$`}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}