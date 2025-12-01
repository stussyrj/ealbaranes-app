import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Truck, MapPin, Clock } from "lucide-react";

// Animated background pattern component
function AnimatedBackground() {
  const circles = [
    { id: 1, size: 300, delay: 0, duration: 20 },
    { id: 2, size: 200, delay: 2, duration: 25 },
    { id: 3, size: 250, delay: 4, duration: 22 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30 dark:to-blue-950/20" />
      
      {/* Left side animated circles */}
      {circles.map((circle) => (
        <motion.div
          key={`left-${circle.id}`}
          className="absolute rounded-full border border-blue-200 dark:border-blue-800/50 opacity-20 dark:opacity-10"
          style={{
            width: circle.size,
            height: circle.size,
            left: `-${circle.size / 2}px`,
            top: `${circle.id * 30}%`,
          }}
          animate={{
            y: [0, 30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: circle.duration,
            delay: circle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Right side animated circles - symmetric */}
      {circles.map((circle) => (
        <motion.div
          key={`right-${circle.id}`}
          className="absolute rounded-full border border-orange-200 dark:border-orange-800/50 opacity-20 dark:opacity-10"
          style={{
            width: circle.size,
            height: circle.size,
            right: `-${circle.size / 2}px`,
            top: `${circle.id * 30}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, -20, 0],
          }}
          transition={{
            duration: circle.duration,
            delay: circle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Center floating dots */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`dot-${i}`}
            className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-blue-500 to-orange-500"
            style={{
              left: `${25 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              delay: i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-900 dark:text-blue-500" />
            <span className="text-xl font-bold text-blue-900 dark:text-blue-400">DirectTransports</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-6 overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div>
                <span className="inline-block px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-semibold rounded-full mb-4">
                  Transporte Profesional
                </span>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                  Presupuestos de transporte al instante
                </h1>
              </div>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Calcula rutas reales, obtén precios justos y gestiona tus envíos de forma sencilla
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => {
                    sessionStorage.removeItem("hasSeenClientAnimation");
                    navigate("/quote");
                  }}
                  className="bg-blue-900 hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-lg px-8 py-6 rounded-lg"
                  data-testid="button-hero-quote"
                >
                  Comienza ahora
                </Button>
              </motion.div>
            </motion.div>

            {/* Right side - Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-2 gap-6"
            >
              {[
                { number: "100%", label: "Rutas reales" },
                { number: "30", textAbove: "Presupuestos en", textBelow: "segundos" },
                { number: "24/7", label: "Disponible" },
                { number: "∞", label: "Flexible" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center"
                >
                  {stat.textAbove && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      {stat.textAbove}
                    </div>
                  )}
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-400">
                    {stat.number}
                  </div>
                  {stat.textBelow ? (
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {stat.textBelow}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {stat.label}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              ¿Por qué DirectTransports?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Somos la solución más rápida y confiable para tu logística
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: "Rutas Precisas",
                description: "Cálculo real de distancias usando datos de carreteras actuales",
              },
              {
                icon: Clock,
                title: "Presupuestos Instantáneos",
                description: "Obtén tu cotización en menos de 30 segundos",
              },
              {
                icon: Truck,
                title: "Servicio Profesional",
                description: "Vehículos y conductores verificados para tu tranquilidad",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
              Sobre DirectTransports
            </h2>
            <div className="space-y-4 text-lg text-slate-700 dark:text-slate-300">
              <p>
                DirectTransports es la plataforma líder de cotización de transporte en la Península Ibérica. 
                Simplificamos el proceso de logística combinando tecnología avanzada con un servicio impecable.
              </p>
              <p>
                Nuestro algoritmo calcula rutas reales basadas en datos de carreteras actuales, 
                eliminando las estimaciones imprecisas y los costes sorpresivos. Ya sea un envío urgente 
                o una ruta regular, obtendrás presupuestos justos y transparentes en segundos.
              </p>
              <p>
                Desde startups hasta grandes empresas, cientos de negocios confían en DirectTransports 
                para optimizar sus entregas y mantener sus costes bajo control.
              </p>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: "Empresas confiando", value: "500+" },
                { label: "Envíos procesados", value: "50K+" },
                { label: "Países cubiertos", value: "3" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-400 mb-2">
                    {item.value}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-lg p-12 text-center space-y-6"
          >
            <h2 className="text-4xl font-bold text-white">
              Listo para tu primer presupuesto?
            </h2>
            <p className="text-xl text-blue-100">
              Sin compromisos. Respuesta en minutos. Completamente gratis.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => {
                  sessionStorage.removeItem("hasSeenClientAnimation");
                  navigate("/quote");
                }}
                className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white text-lg px-10 py-6 rounded-lg"
                data-testid="button-cta-quote"
              >
                Solicitar Presupuesto
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-slate-600 dark:text-slate-400 text-sm">
          <p>© 2025 DirectTransports. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
