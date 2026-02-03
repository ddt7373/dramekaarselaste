import React, { useMemo } from 'react';

interface MindMapNode {
  label: string;
  color: string;
  children?: MindMapNode[];
}

interface MindMapData {
  central: string;
  branches: MindMapNode[];
}

interface MindMapProps {
  data: MindMapData;
  width?: number;
  height?: number;
}

const MindMap: React.FC<MindMapProps> = ({ data, width = 600, height = 500 }) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const centralRadius = 60;
  const branchRadius = 40;
  const childRadius = 28;
  const branchDistance = 150;
  const childDistance = 80;

  // Calculate positions for branches and children
  const layout = useMemo(() => {
    const numBranches = data.branches.length;
    const angleStep = (2 * Math.PI) / numBranches;
    const startAngle = -Math.PI / 2; // Start from top

    return data.branches.map((branch, branchIndex) => {
      const branchAngle = startAngle + branchIndex * angleStep;
      const branchX = centerX + Math.cos(branchAngle) * branchDistance;
      const branchY = centerY + Math.sin(branchAngle) * branchDistance;

      const numChildren = branch.children?.length || 0;
      const childAngleSpread = Math.PI / 3; // 60 degrees spread
      const childStartAngle = branchAngle - childAngleSpread / 2;
      const childAngleStep = numChildren > 1 ? childAngleSpread / (numChildren - 1) : 0;

      const children = (branch.children || []).map((child, childIndex) => {
        const childAngle = numChildren === 1
          ? branchAngle
          : childStartAngle + childIndex * childAngleStep;
        const childX = branchX + Math.cos(childAngle) * childDistance;
        const childY = branchY + Math.sin(childAngle) * childDistance;

        return {
          ...child,
          x: childX,
          y: childY,
          parentX: branchX,
          parentY: branchY
        };
      });

      return {
        ...branch,
        x: branchX,
        y: branchY,
        children
      };
    });
  }, [data, centerX, centerY]);

  // Wrap text to fit in node
  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const charWidth = fontSize * 0.5;

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length * charWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto max-h-[500px] mind-map-svg"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Background */}
      <rect width={width} height={height} fill="#f8fafc" rx="12" />

      {/* Connection lines from center to branches */}
      {layout.map((branch, i) => (
        <g key={`branch-lines-${i}`}>
          {/* Main branch line */}
          <line
            x1={centerX}
            y1={centerY}
            x2={branch.x}
            y2={branch.y}
            stroke={branch.color}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Child lines */}
          {branch.children.map((child, j) => (
            <line
              key={`child-line-${i}-${j}`}
              x1={child.parentX}
              y1={child.parentY}
              x2={child.x}
              y2={child.y}
              stroke={child.color}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
            />
          ))}
        </g>
      ))}

      {/* Child nodes */}
      {layout.map((branch, i) => (
        <g key={`children-${i}`}>
          {branch.children.map((child, j) => {
            const lines = wrapText(child.label, childRadius * 1.8, 10);
            return (
              <g key={`child-${i}-${j}`}>
                <circle
                  cx={child.x}
                  cy={child.y}
                  r={childRadius}
                  fill={child.color}
                  opacity="0.9"
                />
                <text
                  x={child.x}
                  y={child.y - (lines.length - 1) * 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="500"
                >
                  {lines.map((line, lineIndex) => (
                    <tspan
                      key={lineIndex}
                      x={child.x}
                      dy={lineIndex === 0 ? 0 : 12}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </g>
      ))}

      {/* Branch nodes */}
      {layout.map((branch, i) => {
        const lines = wrapText(branch.label, branchRadius * 1.8, 11);
        return (
          <g key={`branch-${i}`}>
            <circle
              cx={branch.x}
              cy={branch.y}
              r={branchRadius}
              fill={branch.color}
              stroke="white"
              strokeWidth="3"
            />
            <text
              x={branch.x}
              y={branch.y - (lines.length - 1) * 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="11"
              fontWeight="600"
            >
              {lines.map((line, lineIndex) => (
                <tspan
                  key={lineIndex}
                  x={branch.x}
                  dy={lineIndex === 0 ? 0 : 13}
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}

      {/* Central node */}
      <g>
        {/* Glow effect */}
        <circle
          cx={centerX}
          cy={centerY}
          r={centralRadius + 8}
          fill="url(#centralGlow)"
          opacity="0.3"
        />
        {/* Main circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={centralRadius}
          fill="url(#centralGradient)"
          stroke="white"
          strokeWidth="4"
        />
        {/* Central text */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="13"
          fontWeight="700"
        >
          {wrapText(data.central, centralRadius * 1.6, 13).map((line, i, arr) => (
            <tspan
              key={i}
              x={centerX}
              dy={i === 0 ? -(arr.length - 1) * 8 : 16}
            >
              {line}
            </tspan>
          ))}
        </text>
      </g>

      {/* Gradients */}
      <defs>
        <radialGradient id="centralGradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </radialGradient>
        <radialGradient id="centralGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export default MindMap;
