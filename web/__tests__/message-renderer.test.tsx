import React from 'react';
import { render } from '@testing-library/react';

// Mock react-markdown to avoid ES module issues in tests
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

jest.mock('remark-gfm', () => ({}));
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

    const { getAllByTestId } = render(
      <MessageRenderer content={content} />
    );
    
    const markdownContents = getAllByTestId('markdown-content');
    expect(markdownContents.length).toBeGreaterThan(0);
    
    // Check the main content (first element) - LaTeX should be removed
    const mainContent = markdownContents[0].textContent || '';
    expect(mainContent).toContain("Here's a formula:");
    expect(mainContent).toContain('End of message.');
    expect(mainContent).not.toContain('<latex>');
    expect(mainContent).not.toContain('</latex>');

    // Check that there's a LaTeX formula rendered (second element)
    if (markdownContents.length > 1) {
      const latexContent = markdownContents[1].textContent || '';
      expect(latexContent).toContain('$');
    }
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

    const { getAllByTestId } = render(
      <MessageRenderer content={content} />
    );
    
    const markdownContents = getAllByTestId('markdown-content');
    expect(markdownContents.length).toBeGreaterThan(0);
    
    // Check the main content (first element) - LaTeX should be removed
    const mainContent = markdownContents[0].textContent || '';
    expect(mainContent).toContain('First formula:');
    expect(mainContent).toContain('Second formula:');
    expect(mainContent).not.toContain('<latex>');
    expect(mainContent).not.toContain('</latex>');

    // Should have LaTeX formulas rendered as additional elements
    expect(markdownContents.length).toBeGreaterThan(1);
  });

  it('preserves regular text when no LaTeX is present', () => {
    const content = 'This is just regular text with no math.';
    
    const { getAllByTestId } = render(
      <MessageRenderer content={content} />
    );
    
    const markdownContents = getAllByTestId('markdown-content');
    // Should only have one markdown content element when no LaTeX
    expect(markdownContents.length).toBe(1);
    expect(markdownContents[0].textContent).toBe(content);
  });
});