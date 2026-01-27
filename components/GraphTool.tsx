
import React, { useMemo } from 'react';

interface Point {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

interface GraphData {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  equation?: string; // e.g. "5 * sin(x)"
  lineColor?: string;
  domain: [number, number];
  range: [number, number];
  points?: Point[];
}

interface GraphToolProps {
  data: GraphData;
  isLargeText?: boolean;
}

const GraphTool: React.FC<GraphToolProps> = ({ data, isLargeText }) => {
  // Use default values for domain and range to prevent crashes if the model omits them
  const { 
    domain = [-10, 10], 
    range = [-10, 10], 
    xAxisLabel = "x", 
    yAxisLabel = "y", 
    equation, 
    lineColor = "#2563EB", 
    points = [] 
  } = data;

  const width = 400;
  const height = 300;
  const padding = 40;

  const graphId = useMemo(() => `graph-${Math.random().toString(36).substr(2, 9)}`, []);

  // Coordinate transforms (safely handle indexing after ensuring domain/range exist)
  const xScale = (val: number) => padding + ((val - domain[0]) / (domain[1] - domain[0])) * (width - 2 * padding);
  const yScale = (val: number) => (height - padding) - ((val - range[0]) / (range[1] - range[0])) * (height - 2 * padding);

  const pathData = useMemo(() => {
    if (!equation) return "";
    let d = "";
    const steps = 200; 
    const stepSize = (domain[1] - domain[0]) / steps;

    const createEvaluator = (expr: string) => {
      const processedExpr = expr
        .replace(/\^/g, '**')
        .replace(/\b(sin|cos|tan|exp|log|sqrt|abs|pow|PI|E)\b/g, 'Math.$1');
      
      try {
        return new Function('x', `return ${processedExpr};`);
      } catch (e) {
        return () => NaN;
      }
    };

    const evalFn = createEvaluator(equation);

    for (let i = 0; i <= steps; i++) {
      const x = domain[0] + i * stepSize;
      const y = evalFn(x);
      const px = xScale(x);
      const py = yScale(y);

      if (!isNaN(py)) {
        const clampedPy = Math.max(-100, Math.min(height + 100, py));
        d += `${d === "" ? 'M' : 'L'} ${px} ${clampedPy} `;
      }
    }
    return d;
  }, [equation, domain, range]);

  const gridLines = useMemo(() => {
    const xLines = [];
    const yLines = [];
    const xStep = Math.max(1, Math.round((domain[1] - domain[0]) / 10));
    const yStep = Math.max(1, Math.round((range[1] - range[0]) / 10));

    for (let i = Math.ceil(domain[0]); i <= Math.floor(domain[1]); i += xStep) {
      if (Math.abs(i) < 0.1) continue;
      xLines.push(i);
    }
    for (let i = Math.ceil(range[0]); i <= Math.floor(range[1]); i += yStep) {
      if (Math.abs(i) < 0.1) continue;
      yLines.push(i);
    }
    return { xLines, yLines };
  }, [domain, range]);

  const labelSize = isLargeText ? "14px" : "10px";

  return (
    <div className="my-4 bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden p-4">
      {data.title && (
        <div id={`${graphId}-title`} className={`text-center font-bold mb-2 ${isLargeText ? 'text-xl' : 'text-base'}`}>
          {data.title}
        </div>
      )}
      
      {/* Screen Reader Only Table for Data Accessibility */}
      <div className="sr-only">
        <p>ئەمە هێڵکارییەکی ماتماتیکییە بۆ هاوکێشەی: {equation}. بواری {domain[0]} بۆ {domain[1]}.</p>
        {points.length > 0 && (
          <table className="border-collapse border border-slate-400">
            <caption>خاڵە گرنگەکانی هێڵکارییەکە</caption>
            <thead>
              <tr>
                <th scope="col">ناو</th>
                <th scope="col">X</th>
                <th scope="col">Y</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, idx) => (
                <tr key={idx}>
                  <td>{p.label || `خاڵی ${idx + 1}`}</td>
                  <td>{p.x}</td>
                  <td>{p.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-auto overflow-visible"
        role="img"
        aria-labelledby={`${graphId}-title ${graphId}-desc`}
      >
        <title id={`${graphId}-title`}>{data.title || "هێڵکاری ماتماتیکی"}</title>
        <desc id={`${graphId}-desc`}>
          هێڵکاری هاوکێشەی {equation} لەگەڵ نیشاندانی خاڵە گرنگەکان وەک کەمترین و زۆرترین نرخ.
        </desc>

        {/* Grid lines */}
        <g aria-hidden="true">
          {gridLines.xLines.map(x => (
            <line key={`x-${x}`} x1={xScale(x)} y1={padding} x2={xScale(x)} y2={height - padding} stroke="currentColor" strokeOpacity="0.05" strokeDasharray="2,2" />
          ))}
          {gridLines.yLines.map(y => (
            <line key={`y-${y}`} x1={padding} y1={yScale(y)} x2={width - padding} y2={yScale(y)} stroke="currentColor" strokeOpacity="0.05" strokeDasharray="2,2" />
          ))}
        </g>

        {/* Axes */}
        <g aria-hidden="true">
          <line x1={padding} y1={yScale(0)} x2={width - padding} y2={yScale(0)} stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
          <line x1={xScale(0)} y1={padding} x2={xScale(0)} y2={height - padding} stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
        </g>

        {/* Axis Titles */}
        <text x={width - 15} y={yScale(0) + 15} fontSize={labelSize} fontWeight="bold" fill="currentColor" opacity="0.6" aria-label={`تەوەری ${xAxisLabel}`}>{xAxisLabel}</text>
        <text x={xScale(0) - 15} y={padding} fontSize={labelSize} fontWeight="bold" fill="currentColor" opacity="0.6" aria-label={`تەوەری ${yAxisLabel}`}>{yAxisLabel}</text>

        {/* Function Path */}
        <path 
          d={pathData} 
          fill="none" 
          stroke={lineColor} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          aria-label={`هێڵی هاوکێشەی ${equation}`}
        />

        {/* Points of Interest (Extrema) */}
        <g role="group" aria-label="خاڵە گرنگەکان">
          {points.map((p, i) => (
            <g key={i} tabIndex={0} aria-label={`${p.label || 'خاڵ'}: x=${p.x}, y=${p.y}`}>
              <circle cx={xScale(p.x)} cy={yScale(p.y)} r="5" fill={p.color || "#EF4444"} className="animate-pulse shadow-sm" />
              {p.label && (
                <text 
                  x={xScale(p.x)} 
                  y={yScale(p.y) - 10} 
                  fontSize={labelSize} 
                  fill={p.color || "#EF4444"} 
                  fontWeight="bold"
                  textAnchor="middle"
                  className="filter drop-shadow-sm"
                  aria-hidden="true"
                >
                  {p.label}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default GraphTool;
