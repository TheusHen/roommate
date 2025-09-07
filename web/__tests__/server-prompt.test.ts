describe('Server Prompt Integration', () => {
  it('should handle LaTeX responses correctly', () => {
    const sampleResponse = `I understand your difficulty! Bhaskara's formula is used to find the roots of a quadratic equation (ax² + bx + c = 0).

The formula is x = (-b ± √(b² - 4ac)) / (2a), where:
- a, b, and c are the coefficients of the equation
- The discriminant (b² - 4ac) determines how many real roots the equation will have

<latex>
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
</latex>`;

    // Verify the response contains both text explanation and LaTeX
    expect(sampleResponse).toContain('Bhaskara\'s formula');
    expect(sampleResponse).toContain('<latex>');
    expect(sampleResponse).toContain('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
    expect(sampleResponse).toContain('</latex>');
  });

  it('should maintain system prompt format', () => {
    const expectedSystemPrompt = `You are Roommate, a personal assistant and study companion who acts like a helpful roommate.
Your role is to maintain natural, warm conversations while providing academic support and helping with various tasks, including calculations, explanations, and study assistance.

Main behavior rules:
1. Always reply in a clear, friendly, and engaging way, like a close friend who's also academically knowledgeable.
2. Automatically adapt to the user's language (if they write in Portuguese, answer in Portuguese; if they switch to English, continue in English).
3. Perform mathematical calculations when requested, showing your work and explaining the steps.
4. Provide comprehensive academic explanations for any subject with examples when helpful.
5. Format responses using Markdown for readability and structure when appropriate.
6. When using LaTeX formulas, first provide the complete explanation in plain text, then include the LaTeX formulas separately below, wrapped in <latex> tags.
7. If the user writes something like "Said: <message>", interpret that as the main input and respond directly.
8. Maintain continuity by remembering the previous context whenever possible.
9. Don't limit yourself - act as a true study partner who can help with any academic or practical question.`;

    // Verify the prompt structure
    expect(expectedSystemPrompt).toContain('You are Roommate');
    expect(expectedSystemPrompt).toContain('personal assistant and study companion');
    expect(expectedSystemPrompt).toContain('LaTeX formulas');
    expect(expectedSystemPrompt).toContain('<latex> tags');
    expect(expectedSystemPrompt).toContain('Markdown for readability');
  });

  it('should support both English and Portuguese responses', () => {
    const englishExample = `Can you help me with the volume of a sphere?

Absolutely! The volume of a sphere is calculated using the formula V = (4/3)πr³, where r is the radius of the sphere.

<latex>
V = \\frac{4}{3}\\pi r^3
</latex>`;

    const portugueseExample = `Said: Estou com dificuldade para entender a fórmula de Bhaskara.

Entendo sua dificuldade! A fórmula de Bhaskara é usada para encontrar as raízes de uma equação quadrática (ax² + bx + c = 0).

<latex>
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
</latex>`;

    expect(englishExample).toContain('volume of a sphere');
    expect(englishExample).toContain('<latex>');
    
    expect(portugueseExample).toContain('fórmula de Bhaskara');
    expect(portugueseExample).toContain('<latex>');
  });
});