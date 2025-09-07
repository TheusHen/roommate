import React from 'react';
import { render } from '@testing-library/react';

// Mock react-markdown to avoid ES module issues in tests
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

jest.mock('remark-math', () => ({}));
jest.mock('rehype-katex', () => ({}));

import { MessageRenderer } from '../components/message-renderer';

describe('MessageRenderer', () => {
  it('renders content correctly', () => {
    const { getByTestId } = render(
      <MessageRenderer content="Hello, this is a simple message!" />
    );
    const content = getByTestId('markdown-content');
    expect(content).toBeInTheDocument();
  });

  it('processes LaTeX tags correctly', () => {
    const content = `Here's a formula:

<latex>
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
</latex>

End of message.`;

    const { getByTestId } = render(
      <MessageRenderer content={content} />
    );
    
    const markdownContent = getByTestId('markdown-content');
    const processedContent = markdownContent.textContent || '';
    
    // Check that LaTeX tags were converted to math delimiters
    expect(processedContent).toContain('$$');
    expect(processedContent).not.toContain('<latex>');
    expect(processedContent).not.toContain('</latex>');
  });

  it('handles multiple LaTeX blocks', () => {
    const content = `First formula:

<latex>
V = \\frac{4}{3}\\pi r^3
</latex>

Second formula:

<latex>
A = \\pi r^2
</latex>`;

    const { getByTestId } = render(
      <MessageRenderer content={content} />
    );
    
    const markdownContent = getByTestId('markdown-content');
    const processedContent = markdownContent.textContent || '';
    
    // Should have two math blocks
    const mathBlocks = (processedContent.match(/\$\$/g) || []).length;
    expect(mathBlocks).toBe(4); // 2 opening and 2 closing $$
  });

  it('preserves regular text when no LaTeX is present', () => {
    const content = 'This is just regular text with no math.';
    
    const { getByTestId } = render(
      <MessageRenderer content={content} />
    );
    
    const markdownContent = getByTestId('markdown-content');
    expect(markdownContent.textContent).toBe(content);
  });
});