import React, { useState, useMemo } from 'react';
import { InteractiveModelData } from '../../types';

interface InteractiveModelBlockProps {
    modelData: InteractiveModelData;
}

// A simple simulation function
const runModel = (input: number[], layers: InteractiveModelData['layers']): number[] => {
    // This is a dummy simulation. It doesn't use real weights.
    // It just produces an output with the correct dimension.
    // A real implementation would involve matrix multiplication.
    const outputLayer = layers[layers.length - 1];
    if (!outputLayer) return [];

    // For demonstration, let's just average the input and return it for each output neuron.
    const sum = input.reduce((a, b) => a + b, 0);
    const avg = sum / (input.length || 1);
    
    return new Array(outputLayer.neurons).fill(avg);
}

const InteractiveModelBlock: React.FC<InteractiveModelBlockProps> = ({ modelData }) => {
    const [layers, setLayers] = useState(modelData.layers);
    const [isRunning, setIsRunning] = useState(false);
    const [prediction, setPrediction] = useState<number[] | null>(null);

    const handleRun = () => {
        setIsRunning(true);
        setPrediction(null);
        setTimeout(() => {
            const output = runModel(modelData.sampleInput, layers);
            setPrediction(output);
            setIsRunning(false);
        }, 1500); // Simulate network propagation time
    };
    
    // SVG drawing logic
    const svgContent = useMemo(() => {
        const width = 600;
        const height = 300;
        const layerGap = 150;
        const neuronRadius = 12;

        const maxNeurons = Math.max(...layers.map(l => l.neurons), 5);
        const layerPositions = layers.map((_, i) => (i * layerGap) + layerGap / 2 + 50);

        const renderedLayers = layers.map((layer, i) => {
            const x = layerPositions[i];
            const neuronGap = (height - 20) / (layer.neurons + 1);
            return layer.neurons > 0 ? Array.from({ length: layer.neurons }).map((_, j) => ({
                cx: x,
                cy: (j + 1) * neuronGap,
                id: `neuron-${i}-${j}`,
                type: layer.type
            })) : [];
        }).filter(l => l.length > 0);

        const connections = [];
        for (let i = 0; i < renderedLayers.length - 1; i++) {
            for (const n1 of renderedLayers[i]) {
                for (const n2 of renderedLayers[i + 1]) {
                    connections.push(
                        <line
                            key={`${n1.id}-to-${n2.id}`}
                            x1={n1.cx} y1={n1.cy}
                            x2={n2.cx} y2={n2.cy}
                            stroke="#cbd5e1"
                            strokeWidth="1"
                            className={isRunning ? 'animate-connection' : ''}
                            style={{ animationDelay: `${i * 0.5}s` }}
                        />
                    );
                }
            }
        }
        
        const neurons = renderedLayers.flat().map((neuron, index) => (
             <circle
                key={neuron.id}
                cx={neuron.cx}
                cy={neuron.cy}
                r={neuronRadius}
                fill={neuron.type === 'input' ? '#34d399' : neuron.type === 'output' ? '#ef4444' : '#60a5fa'}
                stroke="#fff"
                strokeWidth="2"
                className={isRunning ? 'animate-neuron' : ''}
                style={{ animationDelay: `${(renderedLayers.findIndex(l => l.includes(neuron)) * 0.5)}s` }}
            />
        ));

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                <style>
                    {`
                        @keyframes pulse-neuron { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
                        .animate-neuron { animation: pulse-neuron 0.5s ease-in-out; }
                        @keyframes draw-line { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
                        .animate-connection { stroke-dasharray: 200; animation: draw-line 0.5s ease-in-out forwards; }
                    `}
                </style>
                <g>{connections}</g>
                <g>{neurons}</g>
            </svg>
        );

    }, [layers, isRunning]);


    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-bold text-lg text-slate-800">{modelData.title}</h4>
            <p className="text-sm text-gray-600 mb-4">{modelData.description}</p>
            
            <div className="bg-gray-50 rounded-lg overflow-hidden">
                {svgContent}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border">
                    <h5 className="font-semibold text-gray-700">Sample Input</h5>
                    <div className="mt-2 p-2 bg-gray-100 rounded text-center font-mono text-green-700">
                        [{modelData.sampleInput.join(', ')}]
                    </div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                    <h5 className="font-semibold text-gray-700">Predicted Output</h5>
                     <div className="mt-2 p-2 bg-gray-100 rounded text-center font-mono text-red-700 h-10 flex items-center justify-center">
                        {prediction ? `[${prediction.map(p => p.toFixed(2)).join(', ')}]` : '?'}
                    </div>
                </div>
            </div>

            <div className="mt-4 text-center">
                <button
                    onClick={handleRun}
                    disabled={isRunning}
                    className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-wait transition-all duration-300 shadow-lg"
                >
                    {isRunning ? 'Simulating...' : 'Run Simulation'}
                </button>
            </div>
             <div className="mt-4 text-xs text-gray-500">
                 <p><b>Note:</b> This is a simplified visual simulation. For simplicity, it does not include editable layers or real weight calculations.</p>
             </div>
        </div>
    );
};

export default InteractiveModelBlock;