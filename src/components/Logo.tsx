type LogoProps = {
  className?: string;
};

/** Inline SVG so Bebas Neue from the page fonts applies (img/SVG files cannot). */
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 184 182"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="ICK DEATH"
    >
      <text
        x="92"
        y="78"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#C1EF04"
        style={{
          fontFamily: "var(--font-bebas)",
          fontSize: 88,
          letterSpacing: "0.02em",
        }}
      >
        ICK
      </text>
      <text
        x="92"
        y="142"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#B28EED"
        style={{
          fontFamily: "var(--font-bebas)",
          fontSize: 72,
          letterSpacing: "0.01em",
        }}
      >
        DEATH
      </text>
    </svg>
  );
}
