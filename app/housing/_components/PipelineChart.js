'use client';
import { useState } from 'react';
import LineChart, { Legend } from './LineChart';

// sets: { total: [...series], single: [...series] }
export default function PipelineChart({ sets }) {
  const [mode, setMode] = useState('total');
  const series = sets[mode];
  return (
    <div className="card chart-card">
      <div className="section-head" style={{ marginBottom: 0 }}>
        <h2 className="display">Permits, starts, completions</h2>
        <div className="seg" role="group" aria-label="Unit type">
          <button type="button" aria-pressed={mode === 'total'} onClick={() => setMode('total')}>All units</button>
          <button type="button" aria-pressed={mode === 'single'} onClick={() => setMode('single')}>Single-family</button>
        </div>
      </div>
      <Legend items={series} />
      <LineChart series={series} label="Permits, starts and completions, last ten years" format="thousands" />
      <div className="note mono">SAAR, thousands of units · Census New Residential Construction</div>
    </div>
  );
}
