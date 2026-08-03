const fs = require('fs');

const svgContent = fs.readFileSync('public/map/vietnam.svg', 'utf8');
const dataContent = fs.readFileSync('public/map/data.js', 'utf8');

// 1. Extract paths from SVG
let paths = [];
const pathRegex = /<path\s+id="([^"]+)"\s+title="([^"]+)"\s+class="[^"]*"\s+d="([^"]+)"\/>/g;
let match;
while ((match = pathRegex.exec(svgContent)) !== null) {
    paths.push({
        id: match[1],
        title: match[2],
        d: match[3]
    });
}

// 2. Generate VietnamMapSVG.tsx
const svgCode = `
import React from 'react';

interface VietnamMapSVGProps {
    data: any;
    hoveredProvince: string | null;
    onHover: (province: string | null) => void;
    onClick?: (province: string) => void;
}

export default function VietnamMapSVG({ data, hoveredProvince, onHover, onClick }: VietnamMapSVGProps) {
    const handleMouseEnter = (title: string) => {
        onHover(title);
    };

    const handleMouseLeave = () => {
        onHover(null);
    };

    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="10 0 280 180" 
            className="w-full h-full drop-shadow-md"
        >
            <g>
                ${paths.map(p => `
                <path
                    id="${p.id}"
                    d="${p.d}"
                    onMouseEnter={() => handleMouseEnter("${p.title}")}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => onClick && onClick("${p.title}")}
                    className="cursor-pointer transition-colors duration-300"
                    fill={data["${p.title}"]?.hasNPP ? "#10b981" : "#ef4444"}
                    stroke="#ffffff"
                    strokeWidth={hoveredProvince === "${p.title}" ? "0.8" : "0.3"}
                    style={{
                        filter: hoveredProvince === "${p.title}" ? "brightness(1.1)" : "none"
                    }}
                />
                `).join('')}
            </g>
        </svg>
    );
}
`;

fs.writeFileSync('src/components/admin/VietnamMapSVG.tsx', svgCode);

// 3. Extract defaultTargets and nppData manually by splitting strings
const defaultStart = dataContent.indexOf('const defaultTargets = {');
const defaultEnd = dataContent.indexOf('};', defaultStart) + 1;
const defaultStr = dataContent.substring(defaultStart + 23, defaultEnd);

const nppStart = dataContent.indexOf('const nppData = {');
const nppEnd = dataContent.lastIndexOf('};') + 1;
const nppStr = dataContent.substring(nppStart + 16, nppEnd);

const tsCode = `
export interface ProvinceData {
    hasNPP: boolean;
    targets: {
        "Khoai môn CVT"?: number;
        "Kẹo UHi"?: number;
        "Abi Snack"?: number;
        [key: string]: number | undefined;
    };
}

export const defaultTargets = ${defaultStr};

export const nppData: Record<string, ProvinceData> = ${nppStr};
`;

fs.writeFileSync('src/lib/nppData.ts', tsCode);

console.log("Conversion complete!");
