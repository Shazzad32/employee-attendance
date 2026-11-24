// Clock dial: 60 ticks + a progress ring that fills over an 8-hour shift.
export default function Dial({ progress = 0, active, children }) {
  const R = 118;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative mx-auto h-[300px] w-[300px]">
      <svg viewBox="0 0 300 300" className="absolute inset-0 -rotate-90" aria-hidden="true">
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i * 6 * Math.PI) / 180;
          const major = i % 5 === 0;
          const r1 = major ? 136 : 141;
          return (
            <line
              key={i}
              x1={150 + r1 * Math.cos(a)}
              y1={150 + r1 * Math.sin(a)}
              x2={150 + 148 * Math.cos(a)}
              y2={150 + 148 * Math.sin(a)}
              stroke="#C5CEDC"
              strokeWidth={major ? 2 : 1}
            />
          );
        })}
        <circle cx="150" cy="150" r={R} fill="none" stroke="#E2E7EF" strokeWidth="8" />
        <circle
          cx="150"
          cy="150"
          r={R}
          fill="none"
          stroke={active ? "#0F9D74" : "transparent"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - Math.min(progress, 1))}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
