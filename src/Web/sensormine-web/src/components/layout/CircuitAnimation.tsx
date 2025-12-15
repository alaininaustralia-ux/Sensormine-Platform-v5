/**
 * Circuit Animation Component
 * 
 * Subtle animated circuit pattern for sidebar background
 */

'use client';

export function CircuitAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0088FF" stopOpacity="0.3">
              <animate
                attributeName="stop-opacity"
                values="0.3;0.6;0.3"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#00AAFF" stopOpacity="0.5">
              <animate
                attributeName="stop-opacity"
                values="0.5;0.8;0.5"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#0066CC" stopOpacity="0.3">
              <animate
                attributeName="stop-opacity"
                values="0.3;0.6;0.3"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Vertical lines */}
        <g stroke="url(#circuit-gradient)" strokeWidth="1" fill="none">
          <line x1="20%" y1="0" x2="20%" y2="100%">
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              dur="3s"
              repeatCount="indefinite"
            />
          </line>
          <line x1="50%" y1="0" x2="50%" y2="100%">
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              dur="4s"
              begin="1s"
              repeatCount="indefinite"
            />
          </line>
          <line x1="80%" y1="0" x2="80%" y2="100%">
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              dur="3.5s"
              begin="2s"
              repeatCount="indefinite"
            />
          </line>
        </g>

        {/* Horizontal lines */}
        <g stroke="url(#circuit-gradient)" strokeWidth="1" fill="none">
          <line x1="0" y1="20%" x2="100%" y2="20%">
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              dur="3.5s"
              repeatCount="indefinite"
            />
          </line>
          <line x1="0" y1="40%" x2="100%" y2="40%">
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              dur="4s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </line>
          <line x1="0" y1="60%" x2="100%" y2="60%">
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              dur="3s"
              begin="1.5s"
              repeatCount="indefinite"
            />
          </line>
          <line x1="0" y1="80%" x2="100%" y2="80%">
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              dur="3.5s"
              begin="2.5s"
              repeatCount="indefinite"
            />
          </line>
        </g>

        {/* Circuit nodes (connection points) */}
        <g fill="#00AAFF" filter="url(#glow)">
          <circle cx="20%" cy="20%" r="2">
            <animate
              attributeName="opacity"
              values="0.4;0.8;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="50%" cy="40%" r="2">
            <animate
              attributeName="opacity"
              values="0.4;0.8;0.4"
              dur="2.5s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="80%" cy="60%" r="2">
            <animate
              attributeName="opacity"
              values="0.4;0.8;0.4"
              dur="2s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="20%" cy="80%" r="2">
            <animate
              attributeName="opacity"
              values="0.4;0.8;0.4"
              dur="2.5s"
              begin="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="80%" cy="20%" r="2">
            <animate
              attributeName="opacity"
              values="0.4;0.8;0.4"
              dur="2s"
              begin="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="50%" cy="80%" r="2">
            <animate
              attributeName="opacity"
              values="0.4;0.8;0.4"
              dur="2.5s"
              begin="2.5s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Small squares at intersections */}
        <g fill="none" stroke="#00AAFF" strokeWidth="1">
          <rect x="19%" y="39%" width="2%" height="2%">
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur="3s"
              repeatCount="indefinite"
            />
          </rect>
          <rect x="49%" y="19%" width="2%" height="2%">
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur="3s"
              begin="1s"
              repeatCount="indefinite"
            />
          </rect>
          <rect x="79%" y="79%" width="2%" height="2%">
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur="3s"
              begin="2s"
              repeatCount="indefinite"
            />
          </rect>
        </g>

        {/* Moving data pulses */}
        <g fill="#00DDFF">
          <circle cx="0" cy="20%" r="1.5">
            <animate
              attributeName="cx"
              values="0;100%"
              dur="6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="0" cy="60%" r="1.5">
            <animate
              attributeName="cx"
              values="0;100%"
              dur="8s"
              begin="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="8s"
              begin="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="20%" cy="0" r="1.5">
            <animate
              attributeName="cy"
              values="0;100%"
              dur="7s"
              begin="1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="7s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="80%" cy="0" r="1.5">
            <animate
              attributeName="cy"
              values="0;100%"
              dur="9s"
              begin="3s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="9s"
              begin="3s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
    </div>
  );
}
