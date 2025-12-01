export function CustomVan({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ruedas negras */}
      {/* Rueda trasera */}
      <circle cx="20" cy="48" r="8" fill="#1a1a1a" />
      <circle cx="20" cy="48" r="5" fill="#333333" />
      
      {/* Rueda delantera */}
      <circle cx="75" cy="48" r="8" fill="#1a1a1a" />
      <circle cx="75" cy="48" r="5" fill="#333333" />

      {/* Parte delantera blanca (cabina) */}
      <path
        d="M 60 16 L 80 16 L 85 24 L 85 44 L 60 44 Z"
        fill="white"
        stroke="#cccccc"
        strokeWidth="1"
      />

      {/* Ventana delantera */}
      <rect x="63" y="18" width="14" height="10" fill="#e3f2fd" stroke="#999999" strokeWidth="0.5" />

      {/* Caja naranja */}
      <path
        d="M 15 20 L 60 20 L 60 44 L 15 44 Z"
        fill="#ea580c"
        stroke="#d94a08"
        strokeWidth="1"
      />

      {/* Puerta de la caja */}
      <line x1="37" y1="20" x2="37" y2="44" stroke="#d94a08" strokeWidth="1" opacity="0.6" />

      {/* Sombra / detalle */}
      <ellipse cx="37" cy="32" rx="0.5" ry="8" fill="#c2410c" opacity="0.3" />
    </svg>
  );
}
