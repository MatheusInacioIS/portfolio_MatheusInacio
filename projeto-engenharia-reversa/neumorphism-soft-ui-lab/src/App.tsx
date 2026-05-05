/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { MousePointer2, Info, Layout, Layers } from 'lucide-react';

export default function App() {
  const [isPressed, setIsPressed] = useState(false);

  // Configurações de Design
  const bgColor = "#e0e0e0";
  const shadowLight = "#ffffff";
  const shadowDark = "#bebebe";
  const borderRadius = "50px";

  // Estilos de Sombras
  const cardShadow = `20px 20px 60px ${shadowDark}, -20px -20px 60px ${shadowLight}`;
  const buttonShadow = `9px 9px 18px ${shadowDark}, -9px -9px 18px ${shadowLight}`;
  const buttonPressedShadow = `inset 9px 9px 18px ${shadowDark}, inset -9px -9px 18px ${shadowLight}`;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8 transition-colors duration-500"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Lado Esquerdo: Componentes */}
        <div className="flex flex-col items-center gap-10">
          {/* Card Component */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            id="neumorphic-card"
            className="w-72 h-72 flex flex-col items-center justify-center text-center p-6"
            style={{ 
              backgroundColor: bgColor,
              borderRadius: borderRadius,
              boxShadow: cardShadow
            }}
          >
            <div 
              className="p-4 mb-4 rounded-full"
              style={{ boxShadow: `6px 6px 12px ${shadowDark}, -6px -6px 12px ${shadowLight}` }}
            >
              <Layout size={32} className="text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Soft UI Card</h2>
            <p className="text-sm text-gray-500 font-medium">Elevado da superfície através de luz e sombra.</p>
          </motion.div>

          {/* Button Component */}
          <div className="flex flex-col items-center gap-4">
            <button
              id="neumorphic-button"
              onMouseDown={() => setIsPressed(true)}
              onMouseUp={() => setIsPressed(false)}
              onMouseLeave={() => setIsPressed(false)}
              className="w-48 h-16 text-gray-600 font-bold transition-all duration-150 flex items-center justify-center gap-2 group"
              style={{
                backgroundColor: bgColor,
                borderRadius: "20px",
                boxShadow: isPressed ? buttonPressedShadow : buttonShadow,
                transform: isPressed ? "scale(0.98)" : "scale(1)"
              }}
            >
              <MousePointer2 size={18} className="group-hover:translate-x-1 transition-transform" />
              PRESS ME
            </button>
            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Estado: {isPressed ? 'Pressionado' : 'Repouso'}</span>
          </div>
        </div>

        {/* Lado Direito: Explicação Técnica */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-8 rounded-[40px] border border-white/20 bg-white/10 backdrop-blur-sm shadow-xl"
          style={{ 
            backgroundColor: bgColor,
            borderRadius: "40px",
            boxShadow: `10px 10px 30px ${shadowDark}, -10px -10px 30px ${shadowLight}`
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-gray-700 rounded-lg text-white">
              <Info size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">O Segredo do Cálculo</h3>
          </div>
          
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p className="text-sm">
              A harmonia visual do <span className="font-bold">Neumorphism</span> não vem da cor do objeto, mas da interação entre luz e oclusão:
            </p>
            
            <div className="bg-gray-100/50 p-4 rounded-2xl border border-gray-300/30">
              <code className="text-xs block mb-2 font-mono text-gray-800">
                {`box-shadow: 20px 20px 60px #bebebe,`}
                <br />
                {`-20px -20px 60px #ffffff;`}
              </code>
            </div>

            <ul className="text-sm space-y-3">
              <li className="flex gap-3">
                <Layers size={16} className="shrink-0 text-blue-500" />
                <span><strong className="text-gray-800">Dualidade:</strong> Usamos sombras positivas (escuras) e negativas (claras) simultaneamente.</span>
              </li>
              <li className="flex gap-3">
                <Layers size={16} className="shrink-0 text-blue-500" />
                <span><strong className="text-gray-800">Blending:</strong> O desfoque (<em className="italic">Blur</em>) de 60px é propositalmente longo para evitar bordas duras, fundindo o objeto ao background.</span>
              </li>
              <li className="flex gap-3">
                <Layers size={16} className="shrink-0 text-blue-500" />
                <span><strong className="text-gray-800">Inversão:</strong> No estado <code className="bg-gray-200 px-1 rounded">:active</code>, adicionamos o prefixo <code className="bg-gray-200 px-1 rounded">inset</code>, movendo as sombras para dentro e criando a ilusão de concavidade.</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
