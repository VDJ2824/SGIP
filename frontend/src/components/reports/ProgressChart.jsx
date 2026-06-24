export function ProgressChart({ title, items = [] }) {
  const width = 640; const height = 190; const padding = 26;
  const values = items.map((item) => Number(item.value || 0));
  const points = items.map((item, index) => {
    const x = padding + index * ((width - padding * 2) / Math.max(items.length - 1, 1));
    const y = height - padding - (Number(item.value || 0) / 100) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><h3 className="font-semibold text-white">{title}</h3>{items.length ? <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-48 w-full"><line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#94a3b8" opacity=".25" /><polyline points={points} fill="none" stroke="#347f73" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />{items.map((item,index)=><circle key={`${item.date}-${index}`} cx={padding+index*((width-padding*2)/Math.max(items.length-1,1))} cy={height-padding-(Number(item.value||0)/100)*(height-padding*2)} r="5" fill="#4ccbb8" />)}</svg> : <p className="mt-3 text-sm text-slate-400">No historical data available.</p>}<div className="flex flex-wrap gap-3 text-xs text-slate-400">{values.slice(-5).map((value,index)=><span key={`${value}-${index}`}>{value}%</span>)}</div></div>;
}
