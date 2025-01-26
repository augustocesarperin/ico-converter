import React from "react";

// Global SVG filter definitions for refraction effects.
// Render this ONCE near the app root.
const GlobalEffectsDefs: React.FC = () => {
  return (
    <svg aria-hidden className="absolute h-0 w-0">
      <defs>
        {/* Cards refraction */}
        <filter id="icosmith-refraction-cards" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            id="icosmith-turb-cards"
            type="fractalNoise"
            baseFrequency="0.008 0.013"
            numOctaves={2}
            seed={3}
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="0.5" result="blurredNoise" />
          <feDisplacementMap
            id="icosmith-disp-cards"
            in="SourceGraphic"
            in2="blurredNoise"
            scale={26}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Hero refraction (softer) */}
        <filter id="icosmith-refraction-hero" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            id="icosmith-turb-hero"
            type="fractalNoise"
            baseFrequency="0.005 0.009"
            numOctaves={2}
            seed={2}
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="0.5" result="blurredNoise" />
          <feDisplacementMap
            id="icosmith-disp-hero"
            in="SourceGraphic"
            in2="blurredNoise"
            scale={16}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
};

export default GlobalEffectsDefs;





