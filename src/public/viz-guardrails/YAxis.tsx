import { useMemo } from 'react';
import * as d3 from 'd3';

// code taken from https://wattenberger.com/blog/react-and-d3
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function YAxis({ yScale, xRange, horizontalPosition }: { yScale: any, xRange: any, horizontalPosition: any }) {
    const ticks = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return yScale.ticks(5).map((value: any) => ({
            value,
            yOffset: yScale(value),
        }));
    }, [yScale]);

    const format = useMemo(() => {
        return d3.format(',.2r');
    }, []);

    return (
        <>
            {ticks.map(({ value, yOffset }: { value: number, yOffset: number }) => (
                <g key={value} transform={`translate(${horizontalPosition}, ${yOffset})`}>
                    
                    <line x2={`${xRange[1] - xRange[0]}`} stroke={`${value === 0 ? 'black' : 'gainsboro'}`} />
                    <text
                        key={value}
                        style={{
                            dominantBaseline: 'middle',
                            fontSize: '10px',
                            textAnchor: 'end',
                            transform: 'translateX(-6px)',
                            fill: 'black',
                            font: 'Roboto'
                        }}
                    >
                        {value===0 ? '0' : format(value)}
                    </text>
                </g>
            ))}
        </>
    );
}