import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Van3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f8f8);
    scene.fog = new THREE.Fog(0xf8f8f8, 100, 200);
    sceneRef.current = scene;

    // Camera setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 0.8, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -2;
    scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create van
    const vanGroup = new THREE.Group();

    // Caja blanca (body)
    const boxGeometry = new THREE.BoxGeometry(2, 2, 4);
    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f8f8,
      roughness: 0.3,
      metalness: 0.1,
    });
    const box = new THREE.Mesh(boxGeometry, whiteMaterial);
    box.position.set(-0.3, 1, 0);
    box.castShadow = true;
    box.receiveShadow = true;
    vanGroup.add(box);

    // Cabina blanca (cabin)
    const cabinGeometry = new THREE.BoxGeometry(1.6, 1.8, 1.2);
    const cabin = new THREE.Mesh(cabinGeometry, whiteMaterial);
    cabin.position.set(0.8, 1, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    vanGroup.add(cabin);

    // Techo oscuro
    const roofGeometry = new THREE.BoxGeometry(2, 0.3, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.5,
      metalness: 0.1,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-0.3, 2, 0);
    roof.castShadow = true;
    vanGroup.add(roof);

    // Parabrisas (windshield)
    const windshieldGeometry = new THREE.BoxGeometry(1.4, 0.8, 0.1);
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x4da6ff,
      roughness: 0.1,
      metalness: 0,
      transparent: true,
      opacity: 0.6,
    });
    const windshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
    windshield.position.set(1.2, 1.3, 0.6);
    windshield.rotation.z = 0.3;
    windshield.castShadow = true;
    vanGroup.add(windshield);

    // Ventana lateral
    const sideWindowGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.05);
    const sideWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
    sideWindow.position.set(1.3, 1.2, -0.5);
    sideWindow.castShadow = true;
    vanGroup.add(sideWindow);

    // Ruedas (wheels)
    const wheelGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 32);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.4,
      metalness: 0.6,
    });

    // Rueda trasera izquierda
    const wheelBL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelBL.rotation.z = Math.PI / 2;
    wheelBL.position.set(-0.7, 0.45, -1.2);
    wheelBL.castShadow = true;
    wheelBL.receiveShadow = true;
    vanGroup.add(wheelBL);

    // Rueda trasera derecha
    const wheelBR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelBR.rotation.z = Math.PI / 2;
    wheelBR.position.set(-0.7, 0.45, 1.2);
    wheelBR.castShadow = true;
    wheelBR.receiveShadow = true;
    vanGroup.add(wheelBR);

    // Rueda delantera izquierda
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.rotation.z = Math.PI / 2;
    wheelFL.position.set(1.3, 0.45, -1.2);
    wheelFL.castShadow = true;
    wheelFL.receiveShadow = true;
    vanGroup.add(wheelFL);

    // Rueda delantera derecha
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.rotation.z = Math.PI / 2;
    wheelFR.position.set(1.3, 0.45, 1.2);
    wheelFR.castShadow = true;
    wheelFR.receiveShadow = true;
    vanGroup.add(wheelFR);

    // Aros (rims)
    const rimGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      roughness: 0.2,
      metalness: 0.8,
    });

    [wheelBL, wheelBR, wheelFL, wheelFR].forEach((wheel) => {
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      rim.position.copy(wheel.position);
      rim.castShadow = true;
      vanGroup.add(rim);
    });

    // Espejo lateral
    const mirrorGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.15);
    const mirrorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.6,
    });
    const mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
    mirror.position.set(0.3, 1.2, -1.1);
    mirror.castShadow = true;
    vanGroup.add(mirror);

    // Faro frontal
    const headlightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffeb3b,
      roughness: 0.2,
      metalness: 0.4,
      emissive: 0xffd700,
      emissiveIntensity: 0.3,
    });
    const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlight.rotation.z = Math.PI / 2;
    headlight.position.set(1.5, 0.9, 0.7);
    headlight.castShadow = true;
    vanGroup.add(headlight);

    scene.add(vanGroup);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotar van lentamente
      vanGroup.rotation.y += 0.005;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: "400px" }}
    />
  );
}
