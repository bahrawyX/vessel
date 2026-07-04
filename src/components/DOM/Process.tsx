const WORDS = ['PROTOTYPE', 'PRESSURE-TEST', 'POLISH', 'SHIP']

export default function Process() {
  return (
    <section id="process" className="flex min-h-[100svh] items-center">
      {/* the DOM nearly empties so the molten peak plays behind these words */}
      <div className="w-full px-6 text-center mix-blend-difference sm:px-10">
        <span className="type-mono text-[11px] text-dim">03 / PROCESS</span>
        <p className="type-display mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[clamp(1.8rem,4.5vw,3.6rem)] leading-[1.1] text-bone">
          {WORDS.map((word, i) => (
            <span key={word} className="flex items-center gap-5">
              <span data-pword={i} style={{ opacity: 0.08 }}>
                {word}
              </span>
              {i < WORDS.length - 1 && (
                <span aria-hidden="true" className="text-dim">
                  →
                </span>
              )}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
