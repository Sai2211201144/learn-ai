import React, { useState } from 'react';
import { HyperparameterData, Outcome, OutcomeCombination } from '../../types';

// A simple SVG Line Chart component
const LineChart: React.FC<{ data: { training: number[], validation: number[] }, width: number, height: number }> = ({ data, width, height }) => {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...data.training, ...data.validation, 1); // Avoid division by zero, min height is 1
    const minVal = 0; // Assuming loss doesn't go below 0

    const toSvgX = (x: number) => padding + (x / (data.training.length - 1)) * chartWidth;
    const toSvgY = (y: number) => padding + chartHeight - ((y - minVal) / (maxVal - minVal)) * chartHeight;

    const trainingPath = data.training.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(i)} ${toSvgY(p)}`).join(' ');
    const validationPath = data.validation.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(i)} ${toSvgY(p)}`).join(' ');

    const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
        const val = minVal + (maxVal - minVal) * (i / 4);
        return { y: toSvgY(val), label: val.toFixed(2) };
    });

    const xAxisLabels = Array.from({ length: 5 }, (_, i) => {
        const val = Math.round((data.training.length - 1) * (i / 4));
        return { x: toSvgX(val), label: String(val) };
    });

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-labelledby="chart-title" role="img">
            <title id="chart-title">Training and Validation Loss Chart</title>
            {/* Axes */}
            <line x1={padding} y1={padding} x2={padding} y2={padding + chartHeight} stroke="#9ca3af" strokeWidth="1" />
            <line x1={padding} y1={padding + chartHeight} x2={padding + chartWidth} y2={padding + chartHeight} stroke="#9ca3af" strokeWidth="1" />
            
            {/* Y Axis Labels and Grid */}
            {yAxisLabels.map(label => (
                <g key={label.y}>
                    <text x={padding - 8} y={label.y + 4} textAnchor="end" fontSize="10" fill="#6b7280">{label.label}</text>
                    <line x1={padding} y1={label.y} x2={padding + chartWidth} y2={label.y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                </g>
            ))}
            <text transform={`translate(${padding/4}, ${height/2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold">Loss</text>

            {/* X Axis Labels */}
            {xAxisLabels.map(label => (
                <text key={label.x} x={label.x} y={height - padding / 2} textAnchor="middle" fontSize="10" fill="#6b7280">{label.label}</text>
            ))}
            <text x={width/2} y={height - padding/4 + 10} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold">Epoch</text>
            
            {/* Data Paths */}
            <path d={trainingPath} fill="none" stroke="#22c55e" strokeWidth="2" />
            <path d={validationPath} fill="none" stroke="#f97316" strokeWidth="2" />
        </svg>
    );
};


const HyperparameterSimulatorBlock: React.FC<{ modelData: HyperparameterData }> = ({ modelData }) => {
    const initialSelections = new Array(modelData.parameters.length).fill(0);
    const [selections, setSelections] = useState<number[]>(initialSelections);

    const handleSelectionChange = (paramIndex: number, optionIndex: number) => {
        const newSelections = [...selections];
        newSelections[paramIndex] = optionIndex;
        setSelections(newSelections);
    };

    const outcomeKey = selections.join('-');
    const currentOutcome: Outcome | null = modelData.outcomes.find(o => o.combination === outcomeKey)?.result || null;

    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-bold text-lg text-slate-800">{modelData.title}</h4>
            <p className="text-sm text-gray-600 mb-4">{modelData.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {modelData.parameters.map((param, pIndex) => (
                    <div key={pIndex} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <label className="font-semibold text-slate-700 block mb-2">{param.name}</label>
                        <div className="space-y-1">
                            {param.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center">
                                    <input 
                                        type="radio" 
                                        id={`param-${pIndex}-opt-${oIndex}`}
                                        name={`param-${pIndex}`}
                                        value={oIndex}
                                        checked={selections[pIndex] === oIndex}
                                        onChange={() => handleSelectionChange(pIndex, oIndex)}
                                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                                    />
                                    <label htmlFor={`param-${pIndex}-opt-${oIndex}`} className="ml-2 text-sm text-slate-600 cursor-pointer">{option.label}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-300">
                <div className="flex justify-end items-center gap-4 mb-2">
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-xs font-medium text-gray-600">Training Loss</span>
                    </div>
                     <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                        <span className="text-xs font-medium text-gray-600">Validation Loss</span>
                    </div>
                </div>
                 {currentOutcome ? (
                    <LineChart data={{training: currentOutcome.trainingLoss, validation: currentOutcome.validationLoss}} width={600} height={300} />
                 ) : (
                    <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-md text-gray-500">
                        Select a valid combination of parameters to see the result.
                    </div>
                 )}
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
                <h5 className="font-bold mb-1">Analysis</h5>
                <p className="text-sm">{currentOutcome ? currentOutcome.description : "Adjust the parameters above to see how they impact model training."}</p>
            </div>
        </div>
    );
}

export default HyperparameterSimulatorBlock;