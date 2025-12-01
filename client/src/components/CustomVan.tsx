export function CustomVan({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 130"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Sombra del suelo */}
      <ellipse cx="110" cy="120" rx="95" ry="8" fill="#000000" opacity="0.12" />

      {/* Rueda trasera */}
      <g>
        {/* Llanta exterior */}
        <circle cx="50" cy="105" r="19" fill="#1a1a1a" />
        {/* Aro plateado */}
        <circle cx="50" cy="105" r="15" fill="#c0c0c0" />
        {/* Detalles del aro */}
        <circle cx="50" cy="105" r="12" fill="#d4d4d4" />
        <circle cx="50" cy="105" r="8" fill="#a8a8a8" />
        {/* Centro */}
        <circle cx="50" cy="105" r="4" fill="#808080" />
      </g>

      {/* Rueda delantera */}
      <g>
        {/* Llanta exterior */}
        <circle cx="175" cy="105" r="19" fill="#1a1a1a" />
        {/* Aro plateado */}
        <circle cx="175" cy="105" r="15" fill="#c0c0c0" />
        {/* Detalles del aro */}
        <circle cx="175" cy="105" r="12" fill="#d4d4d4" />
        <circle cx="175" cy="105" r="8" fill="#a8a8a8" />
        {/* Centro */}
        <circle cx="175" cy="105" r="4" fill="#808080" />
      </g>

      {/* Línea de chasis */}
      <line x1="45" y1="105" x2="180" y2="105" stroke="#555555" strokeWidth="2" />

      {/* Caja blanca (trasera) */}
      <g>
        {/* Cuerpo principal */}
        <rect x="40" y="40" width="105" height="65" fill="#f8f8f8" stroke="#d0d0d0" strokeWidth="1.5" />
        
        {/* Techo oscuro (ventilación) */}
        <rect x="40" y="35" width="105" height="6" fill="#2a2a2a" stroke="#1a1a1a" strokeWidth="1" />
        
        {/* Puerta de carga lateral */}
        <rect x="60" y="50" width="65" height="45" fill="#efefef" stroke="#b8b8b8" strokeWidth="1" />
        
        {/* Divisiones de puerta */}
        <line x1="87" y1="50" x2="87" y2="95" stroke="#c0c0c0" strokeWidth="0.8" opacity="0.6" />
        <line x1="114" y1="50" x2="114" y2="95" stroke="#c0c0c0" strokeWidth="0.8" opacity="0.6" />
        
        {/* Sombra lateral para profundidad */}
        <rect x="143" y="40" width="2" height="65" fill="#000000" opacity="0.1" />
        
        {/* Línea inferior de la caja */}
        <line x1="40" y1="105" x2="145" y2="105" stroke="#d0d0d0" strokeWidth="1" />
      </g>

      {/* Cabina blanca (delantera) */}
      <g>
        {/* Cuerpo principal */}
        <path
          d="M 140 50 L 185 50 L 200 62 L 200 105 L 140 105 Z"
          fill="#f8f8f8"
          stroke="#d0d0d0"
          strokeWidth="1.5"
        />
        
        {/* Techo redondeado oscuro */}
        <path
          d="M 140 50 Q 162 30 185 50"
          fill="#2a2a2a"
          stroke="#1a1a1a"
          strokeWidth="1.5"
        />
        
        {/* Parabrisas (ventana frontal) */}
        <path
          d="M 150 55 Q 162 40 180 55 L 180 72 Q 162 68 150 72 Z"
          fill="#4da6ff"
          opacity="0.65"
          stroke="#2d5fa3"
          strokeWidth="0.8"
        />
        
        {/* Ventana lateral trasera */}
        <rect x="188" y="62" width="12" height="25" fill="#4da6ff" opacity="0.65" stroke="#2d5fa3" strokeWidth="0.8" />
        
        {/* Faro frontal */}
        <circle cx="197" cy="56" r="4.5" fill="#ffeb3b" opacity="0.7" />
        <circle cx="197" cy="56" r="2.5" fill="#fff9c4" />
        
        {/* Marco de puerta */}
        <line x1="152" y1="72" x2="152" y2="105" stroke="#c0c0c0" strokeWidth="1" />
        
        {/* Espejo lateral */}
        <rect x="145" y="65" width="7" height="10" fill="#1a1a1a" stroke="#000000" strokeWidth="0.5" />
        
        {/* Manija de puerta */}
        <circle cx="157" cy="85" r="2.5" fill="#666666" />
        
        {/* Sombra de profundidad */}
        <rect x="198" y="50" width="2" height="55" fill="#000000" opacity="0.08" />
      </g>

      {/* Parachoques frontal */}
      <rect x="185" y="100" width="18" height="5" fill="#1a1a1a" stroke="#0d0d0d" strokeWidth="0.8" />
      
      {/* Conexión cabina-caja */}
      <line x1="140" y1="100" x2="140" y2="110" stroke="#555555" strokeWidth="1.5" />
    </svg>
  );
}
