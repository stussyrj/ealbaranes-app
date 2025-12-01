import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Truck, MapPin, Clock } from "lucide-react";

export default function LandingPage() {
  const [, navigate] = useLocation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const floatVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-blue-950 dark:via-slate-900 dark:to-orange-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-10 left-10 w-20 h-20 rounded-full bg-blue-900/20 dark:bg-blue-600/30"
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-orange-400/20 dark:bg-orange-600/20"
          animate={{
            y: [0, 20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 right-20 w-16 h-16 rounded-full bg-blue-800/20 dark:bg-blue-500/30"
          animate={{
            x: [0, 15, 0],
            opacity: [0.25, 0.5, 0.25],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24 flex items-center justify-center min-h-screen">
        <motion.div
          className="text-center space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo / Brand */}
          <motion.div variants={floatVariants} className="flex justify-center">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Truck className="w-12 h-12 text-orange-600 dark:text-orange-500" />
              </motion.div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-orange-600 dark:from-blue-400 dark:to-orange-500 bg-clip-text text-transparent">
                DirectTransports
              </h1>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
              Tu solución de{" "}
              <span className="bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-400 dark:to-orange-300 bg-clip-text text-transparent">
                transporte rápido
              </span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Calcula tu presupuesto en segundos y recibe servicio de transporte profesional
            </p>
          </motion.div>

          {/* Company story */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Sobre nosotros
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
              En <span className="font-semibold">DirectTransports</span>, nos especializamos en ofrecer soluciones de transporte confiables y eficientes para toda la Península Ibérica. 
              Con años de experiencia en el sector, hemos ayudado a cientos de empresas a optimizar sus entregas mediante precios justos, 
              disponibilidad flexible y un servicio personalizado. Nuestro objetivo es simplificar el proceso de logística para que puedas 
              enfocarte en tu negocio.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: "Rutas precisas",
                description: "Cálculo real de distancias y tiempos",
              },
              {
                icon: Clock,
                title: "Rápido",
                description: "Presupuestos instantáneos y flexibles",
              },
              {
                icon: Truck,
                title: "Fiable",
                description: "Servicio profesional garantizado",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow border-2 border-blue-900/20 dark:border-blue-600/30 hover:border-orange-500/40 dark:hover:border-orange-500/50 transition-colors"
                whileHover={{ translateY: -8 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <feature.icon className="w-10 h-10 text-orange-600 dark:text-orange-500 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            variants={itemVariants}
            className="pt-4"
            whileHover={{ scale: 1.05 }}
          >
            <Button
              onClick={() => navigate("/quote")}
              className="bg-gradient-to-r from-blue-900 to-orange-600 hover:from-blue-950 hover:to-orange-700 dark:from-blue-700 dark:to-orange-600 dark:hover:from-blue-800 dark:hover:to-orange-700 text-white text-lg px-12 py-7 rounded-lg shadow-xl"
              data-testid="button-request-quote"
            >
              Solicitar Presupuesto
            </Button>
          </motion.div>

          {/* Footer note */}
          <motion.p
            variants={itemVariants}
            className="text-sm text-slate-500 dark:text-slate-400 pt-4"
          >
            Sin compromisos • Presupuesto gratis • Respuesta en minutos
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
