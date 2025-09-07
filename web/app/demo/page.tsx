'use client';

import { MessageRenderer } from '../../components/message-renderer';

export default function Demo() {
  const sampleRoommateResponse = `Entendo sua dificuldade! A fórmula de Bhaskara é usada para encontrar as raízes de uma equação quadrática (ax² + bx + c = 0).

A fórmula é x = (-b ± √(b² - 4ac)) / (2a), onde:
- **a**, **b** e **c** são os coeficientes da equação
- O discriminante (b² - 4ac) determina quantas raízes reais a equação terá

Vamos ver um exemplo: para resolver x² + 5x + 6 = 0, temos a=1, b=5, c=6.
Substituindo na fórmula: x = (-5 ± √(25 - 24)) / 2 = (-5 ± √1) / 2 = (-5 ± 1) / 2
Isso nos dá x = -3 ou x = -2

<latex>
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
</latex>

---

**Can you help me with the volume of a sphere?**

Absolutely! The volume of a sphere is calculated using the formula V = (4/3)πr³, where r is the radius of the sphere.

For example, if a sphere has a radius of 5 cm, its volume would be:
V = (4/3) × π × 5³ = (4/3) × π × 125 ≈ 523.6 cubic centimeters

<latex>
V = \\frac{4}{3}\\pi r^3
</latex>

---

**Give me three tips to study better for tests.**

Com prazer! Aqui estão três dicas eficazes para melhorar seus estudos para testes:

1. **Pratique a recuperação ativa**: Em vez de apenas reler o material, teste-se respondendo perguntas ou explicando conceitos em voz alta. Isso fortalece muito mais sua memória do que simplesmente reler.

2. **Use a Técnica Pomodoro**: Estude em blocos de 25 minutos com pausas de 5 minutos. Após quatro blocos, faça uma pausa mais longa de 15-30 minutos. Isso mantém sua mente fresca e previne o esgotamento.

3. **Crie mapas mentais ou resumos estruturados**: Organizar visualmente as informações ajuda você a entender as conexões entre diferentes conceitos e facilita a revisão rápida antes do teste.

Você já usa alguma dessas técnicas, ou gostaria de saber mais sobre uma específica?`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Roommate AI - Markdown & LaTeX Demo</h1>
          <p className="text-gray-600">
            This demonstrates the new AI prompt capabilities with Markdown formatting and LaTeX math rendering.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Roommate Response</h2>
              <p className="text-sm text-purple-600">Multilingual support with math formulas</p>
            </div>
          </div>

          <MessageRenderer 
            content={sampleRoommateResponse} 
            className="text-gray-900"
          />
        </div>

        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Features Demonstrated:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✅ **Multilingual responses** (Portuguese and English)</li>
            <li>✅ **Markdown formatting** (bold, lists, headers)</li>
            <li>✅ **LaTeX math rendering** with proper `&lt;latex&gt;` tag processing</li>
            <li>✅ **Comprehensive explanations** with examples</li>
            <li>✅ **Study companion behavior** as specified in the prompt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}