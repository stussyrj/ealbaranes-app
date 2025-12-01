export function CustomVan({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Sombra del suelo */}
      <ellipse cx="100" cy="108" rx="80" ry="8" fill="#000000" opacity="0.1" />

      {/* Rueda trasera */}
      <g>
        {/* Llanta */}
        <circle cx="45" cy="95" r="18" fill="#1a1a1a" />
        {/* Aro */}
        <circle cx="45" cy="95" r="14" fill="#333333" />
        <circle cx="45" cy="95" r="10" fill="#1a1a1a" />
        {/* Detalles */}
        <circle cx="45" cy="95" r="6" fill="#444444" />
        <circle cx="45" cy="95" r="3" fill="#555555" />
      </g>

      {/* Rueda delantera */}
      <g>
        {/* Llanta */}
        <circle cx="155" cy="95" r="18" fill="#1a1a1a" />
        {/* Aro */}
        <circle cx="155" cy="95" r="14" fill="#333333" />
        <circle cx="155" cy="95" r="10" fill="#1a1a1a" />
        {/* Detalles */}
        <circle cx="155" cy="95" r="6" fill="#444444" />
        <circle cx="155" cy="95" r="3" fill="#555555" />
      </g>

      {/* Chasis */}
      <line x1="40" y1="95" x2="160" y2="95" stroke="#555555" strokeWidth="2" />

      {/* Caja naranja (trasera) */}
      <g>
        {/* Cuerpo principal */}
        <rect x="35" y="35" width="95" height="60" fill="#ea580c" />
        
        {/* Parte superior gradiente (efecto 3D) */}
        <rect x="35" y="35" width="95" height="8" fill="#f5691a" />
        
        {/* Puerta lateral */}
        <rect x="55" y="45" width="55" height="40" fill="#d94a08" stroke="#c2410c" strokeWidth="1.5" />
        
        {/* Marco de puerta */}
        <line x1="75" y1="45" x2="75" y2="85" stroke="#c2410c" strokeWidth="1" opacity="0.6" />
        <line x1="95" y1="45" x2="95" y2="85" stroke="#c2410c" strokeWidth="1" opacity="0.6" />
        
        {/* Remaches decorativos */}
        <circle cx="40" cy="40" r="2" fill="#c2410c" />
        <circle cx="50" cy="40" r="2" fill="#c2410c" />
        <circle cx="120" cy="40" r="2" fill="#c2410c" />
        <circle cx="130" cy="40" r="2" fill="#c2410c" />
        
        {/* Sombra lateral (efecto 3D) */}
        <rect x="128" y="35" width="2" height="60" fill="#000000" opacity="0.15" />
      </g>

      {/* Cabina blanca (delantera) */}
      <g>
        {/* Cuerpo principal */}
        <path
          d="M 125 45 L 165 45 L 175 55 L 175 95 L 125 95 Z"
          fill="white"
          stroke="#d0d0d0"
          strokeWidth="1.5"
        />
        
        {/* Techo redondeado */}
        <path
          d="M 125 45 Q 145 25 165 45"
          fill="#f5f5f5"
          stroke="#d0d0d0"
          strokeWidth="1.5"
        />
        
        {/* Ventana principal (parabrisas) */}
        <path
          d="M 132 50 Q 145 35 160 50 L 160 65 Q 145 60 132 65 Z"
          fill="#b3d9ff"
          opacity="0.7"
          stroke="#7fb3d5"
          strokeWidth="1"
        />
        
        {/* Ventana lateral */}
        <rect x="165" y="55" width="10" height="20" fill="#b3d9ff" opacity="0.7" stroke="#7fb3d5" strokeWidth="1" />
        
        {/* Faro frontal derecho */}
        <circle cx="172" cy="48" r="4" fill="#ffeb3b" opacity="0.8" />
        <circle cx="172" cy="48" r="2.5" fill="#fff59d" />
        
        {/* Marco de puerta */}
        <line x1="135" y1="65" x2="135" y2="95" stroke="#d0d0d0" strokeWidth="1" />
        
        {/* Espejo lateral */}
        <rect x="128" y="60" width="6" height="8" fill="#333333" stroke="#1a1a1a" strokeWidth="0.5" />
        
        {/* Manija de puerta */}
        <circle cx="138" cy="80" r="2" fill="#888888" />
        
        {/* Sombra lateral */}
        <rect x="173" y="45" width="2" height="50" fill="#000000" opacity="0.1" />
      </g>

      {/* Parachoques frontal */}
      <rect x="160" y="88" width="20" height="7" fill="#333333" stroke="#1a1a1a" strokeWidth="1" />
      
      {/* Conexión cabina-caja */}
      <rect x="122" y="85" width="3" height="10" fill="#666666" />
    </svg>
  );
}
