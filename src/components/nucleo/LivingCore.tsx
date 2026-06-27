import { Sparkles } from 'lucide-react';

interface LivingCoreProps {
  level: number;
  points: number;
  size?: number;
}

const orbitOffsets = [0, 72, 144, 216, 288];

const LivingCore = ({ level, points, size = 208 }: LivingCoreProps) => {
  const outerInset = Math.round(size * 0.18);
  const coreSize = Math.round(size * 0.56);
  const orbitDistance = Math.round(size * 0.42);

  return (
    <div className="score-float" style={{ height: size, position: 'relative', width: size }}>
      {[0, 1, 2].map((ring) => (
        <span
          key={ring}
          className="score-pulse-ring"
          style={{
            animationDelay: `${ring * 0.85}s`,
            border: '1.5px solid rgba(43, 194, 116, 0.45)',
            borderRadius: 999,
            inset: outerInset,
            position: 'absolute',
          }}
        />
      ))}

      <div
        style={{
          animation: 'score-spin 18s linear infinite',
          inset: 0,
          position: 'absolute',
        }}
      >
        {orbitOffsets.map((offset, index) => (
          <span
            key={offset}
            style={{
              background: index % 2 === 0 ? '#2bc274' : '#7fe3ae',
              borderRadius: 999,
              boxShadow: '0 0 14px rgba(43, 194, 116, 0.75)',
              height: index % 2 === 0 ? 9 : 6,
              left: '50%',
              position: 'absolute',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${offset}deg) translateX(${orbitDistance}px)`,
              width: index % 2 === 0 ? 9 : 6,
            }}
          />
        ))}
      </div>

      <div
        style={{
          animation: 'score-breathe 4.5s ease-in-out infinite',
          background:
            'radial-gradient(circle at 34% 28%, #43e08c 0%, #15a35a 42%, #0b6038 100%)',
          borderRadius: 999,
          boxShadow:
            '0 0 0 20px rgba(43, 194, 116, 0.12), 0 0 64px rgba(43, 194, 116, 0.52)',
          color: '#ffffff',
          display: 'grid',
          height: coreSize,
          left: '50%',
          placeItems: 'center',
          position: 'absolute',
          textAlign: 'center',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: coreSize,
        }}
      >
        <div>
          <Sparkles className="mx-auto h-7 w-7" />
          <div className="score-display mt-2 text-[11px] font-bold uppercase tracking-[0.22em]">
            Nucleo
          </div>
          <div className="score-display text-[30px] font-bold leading-none">Nv {level}</div>
          <div className="mt-1 text-xs font-semibold text-white/80">{points} pts</div>
        </div>
      </div>
    </div>
  );
};

export default LivingCore;
