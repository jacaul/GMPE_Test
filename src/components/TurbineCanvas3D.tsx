import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { TurbinePart } from "../types";
import { Eye, EyeOff, Wind, RotateCw, ZoomIn, Layers } from "lucide-react";

interface TurbineCanvas3DProps {
  selectedPart?: TurbinePart | null;
  onSelectPart?: (part: TurbinePart) => void;
  windSpeed?: number; // m/s (typically 3 - 25 m/s)
  isXRayDefault?: boolean;
}

export const TurbineCanvas3D: React.FC<TurbineCanvas3DProps> = ({
  selectedPart,
  onSelectPart,
  windSpeed = 10,
  isXRayDefault = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isXRay, setIsXRay] = useState(isXRayDefault);
  const [showWindParticles, setShowWindParticles] = useState(true);
  const [currentView, setCurrentView] = useState<"general" | "nacelle" | "rotor" | "generator">("nacelle");

  // References to animate Three.js objects
  const animRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    rotorGroup: THREE.Group;
    highSpeedShaft: THREE.Mesh;
    anemometerGroup: THREE.Group;
    nacelleCanopy: THREE.Mesh;
    nacelleCanopyCap: THREE.Mesh;
    windParticles: THREE.Points;
    targetCameraPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    currentLookAt: THREE.Vector3;
    highlightMesh: THREE.Mesh;
    reqId: number;
    isDragging: boolean;
    prevMouse: { x: number; y: number };
    spherical: { radius: number; theta: number; phi: number };
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.015);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(7, 3.5, 8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xddeeff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-10, 6, -10);
    scene.add(rimLight);

    // Ground Grid / Pad
    const gridHelper = new THREE.GridHelper(24, 24, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -6;
    scene.add(gridHelper);

    // ROOT TURBINE GROUP
    const turbineGroup = new THREE.Group();
    scene.add(turbineGroup);

    // 1. TOWER (Pieza 14)
    const towerGeo = new THREE.CylinderGeometry(0.7, 1.1, 8, 32);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.2,
      roughness: 0.4,
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, -2, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    turbineGroup.add(tower);

    // Tower door
    const doorGeo = new THREE.BoxGeometry(0.2, 0.6, 0.05);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, -5.5, 0.95);
    turbineGroup.add(door);

    // 2. YAW SYSTEM (Piezas 15 y 16: Anillo y cojinete de orientación)
    const yawRingGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.2, 32);
    const yawRingMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
    const yawRing = new THREE.Mesh(yawRingGeo, yawRingMat);
    yawRing.position.set(0, 2.0, 0);
    turbineGroup.add(yawRing);

    // 3. NACELLE BASE / BEDPLATE (Pieza 17)
    const bedplateGeo = new THREE.BoxGeometry(4.6, 0.25, 1.4);
    const bedplateMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
    const bedplate = new THREE.Mesh(bedplateGeo, bedplateMat);
    bedplate.position.set(-0.6, 2.2, 0);
    turbineGroup.add(bedplate);

    // 4. CANOPY (Pieza 19: Dosel / cubierta de la góndola)
    const canopyGeo = new THREE.BoxGeometry(4.8, 1.6, 1.6);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.1,
      roughness: 0.3,
      transparent: true,
      opacity: isXRayDefault ? 0.28 : 0.94,
      wireframe: false,
    });
    const nacelleCanopy = new THREE.Mesh(canopyGeo, canopyMat);
    nacelleCanopy.position.set(-0.6, 3.1, 0);
    turbineGroup.add(nacelleCanopy);

    // Nacelle rear aerodynamic tapered cap
    const rearCapGeo = new THREE.ConeGeometry(1.0, 1.6, 32);
    const nacelleCanopyCap = new THREE.Mesh(rearCapGeo, canopyMat);
    nacelleCanopyCap.rotation.z = Math.PI / 2;
    nacelleCanopyCap.position.set(-3.6, 3.1, 0);
    turbineGroup.add(nacelleCanopyCap);

    // 5. MAIN BEARING (Pieza 6: Cojinete principal)
    const mainBearingGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.4, 24);
    const bearingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const mainBearing = new THREE.Mesh(mainBearingGeo, bearingMat);
    mainBearing.rotation.z = Math.PI / 2;
    mainBearing.position.set(1.4, 3.1, 0);
    turbineGroup.add(mainBearing);

    // 6. MAIN SHAFT (Pieza 7: Eje principal de baja velocidad)
    const mainShaftGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.4, 24);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const mainShaft = new THREE.Mesh(mainShaftGeo, steelMat);
    mainShaft.rotation.z = Math.PI / 2;
    mainShaft.position.set(1.1, 3.1, 0);
    turbineGroup.add(mainShaft);

    // 7. GEARBOX / MULTIPLICADORA (Pieza 8)
    const gearboxGroup = new THREE.Group();
    const gearboxBodyGeo = new THREE.CylinderGeometry(0.68, 0.75, 1.1, 24);
    const gearboxMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.6, roughness: 0.35 });
    const gearboxBody = new THREE.Mesh(gearboxBodyGeo, gearboxMat);
    gearboxBody.rotation.z = Math.PI / 2;
    gearboxGroup.add(gearboxBody);

    // Gearbox ribs & detail
    const ribGeo = new THREE.BoxGeometry(0.9, 0.15, 1.5);
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x075985, metalness: 0.7 });
    const rib = new THREE.Mesh(ribGeo, ribMat);
    gearboxGroup.add(rib);

    gearboxGroup.position.set(0.0, 3.1, 0);
    turbineGroup.add(gearboxGroup);

    // 8. OIL FILTER (Pieza 18: Filtro de aceite)
    const oilFilterGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 16);
    const filterMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.5 });
    const oilFilter = new THREE.Mesh(oilFilterGeo, filterMat);
    oilFilter.position.set(-0.4, 2.7, 0.55);
    turbineGroup.add(oilFilter);

    // 9. HIGH SPEED SHAFT & DISC BRAKE (Pieza 9: Disco del freno)
    const brakeDiscGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.06, 24);
    const brakeDiscMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
    const brakeDisc = new THREE.Mesh(brakeDiscGeo, brakeDiscMat);
    brakeDisc.rotation.z = Math.PI / 2;
    brakeDisc.position.set(-0.8, 3.1, 0);
    turbineGroup.add(brakeDisc);

    // Brake caliper (Pinza del freno)
    const caliperGeo = new THREE.BoxGeometry(0.18, 0.32, 0.24);
    const caliperMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(-0.8, 3.4, 0.3);
    turbineGroup.add(caliper);

    // High speed shaft
    const hsShaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 16);
    const highSpeedShaft = new THREE.Mesh(hsShaftGeo, steelMat);
    highSpeedShaft.rotation.z = Math.PI / 2;
    highSpeedShaft.position.set(-0.9, 3.1, 0);
    turbineGroup.add(highSpeedShaft);

    // 10. COUPLING (Pieza 10: Acoplamiento)
    const couplingGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 20);
    const couplingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const coupling = new THREE.Mesh(couplingGeo, couplingMat);
    coupling.rotation.z = Math.PI / 2;
    coupling.position.set(-1.3, 3.1, 0);
    turbineGroup.add(coupling);

    // 11. GENERATOR (Pieza 11: Generador)
    const genBodyGeo = new THREE.CylinderGeometry(0.56, 0.56, 1.35, 24);
    const genMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.6, roughness: 0.3 });
    const generator = new THREE.Mesh(genBodyGeo, genMat);
    generator.rotation.z = Math.PI / 2;
    generator.position.set(-2.1, 3.1, 0);
    turbineGroup.add(generator);

    // 12. GENERATOR COOLING FAN (Pieza 20: Ventilador del generador)
    const fanCoverGeo = new THREE.CylinderGeometry(0.48, 0.54, 0.28, 20);
    const fanCoverMat = new THREE.MeshStandardMaterial({ color: 0x172554, metalness: 0.5 });
    const fanCover = new THREE.Mesh(fanCoverGeo, fanCoverMat);
    fanCover.rotation.z = Math.PI / 2;
    fanCover.position.set(-2.9, 3.1, 0);
    turbineGroup.add(fanCover);

    // 13. SERVICE CRANE (Pieza 12: Grúa de servicio)
    const craneGroup = new THREE.Group();
    const craneRailGeo = new THREE.BoxGeometry(2.4, 0.08, 0.08);
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const craneRail = new THREE.Mesh(craneRailGeo, craneMat);
    craneRail.position.set(-1.6, 3.8, 0);
    craneGroup.add(craneRail);

    const hoistGeo = new THREE.BoxGeometry(0.25, 0.35, 0.2);
    const hoist = new THREE.Mesh(hoistGeo, craneMat);
    hoist.position.set(-1.5, 3.6, 0);
    craneGroup.add(hoist);
    turbineGroup.add(craneGroup);

    // 14. METEOROLOGICAL SENSORS (Pieza 13: Anemómetro y veleta)
    const sensorMastGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12);
    const sensorMastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const sensorMast = new THREE.Mesh(sensorMastGeo, sensorMastMat);
    sensorMast.position.set(-3.2, 4.2, 0);
    turbineGroup.add(sensorMast);

    const anemometerGroup = new THREE.Group();
    anemometerGroup.position.set(-3.2, 4.6, 0);
    // 3 cups
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const armGeo = new THREE.BoxGeometry(0.22, 0.02, 0.02);
      const arm = new THREE.Mesh(armGeo, sensorMastMat);
      arm.rotation.y = angle;
      arm.position.set(Math.cos(angle) * 0.11, 0, Math.sin(angle) * 0.11);
      anemometerGroup.add(arm);

      const cupGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const cup = new THREE.Mesh(cupGeo, craneMat);
      cup.position.set(Math.cos(angle) * 0.22, 0, Math.sin(angle) * 0.22);
      anemometerGroup.add(cup);
    }
    turbineGroup.add(anemometerGroup);

    // 15. ROTOR GROUP (Palas, buje y cono)
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(2.0, 3.1, 0);
    turbineGroup.add(rotorGroup);

    // Rotor Hub (Pieza 5: Buje del rotor)
    const hubGeo = new THREE.SphereGeometry(0.68, 24, 24);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.3, roughness: 0.3 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.scale.set(0.9, 0.9, 0.9);
    rotorGroup.add(hub);

    // Nose Cone / Spinner (Pieza 1: Cono de la hélice)
    const spinnerGeo = new THREE.ConeGeometry(0.68, 1.2, 32);
    const spinner = new THREE.Mesh(spinnerGeo, hubMat);
    spinner.rotation.z = -Math.PI / 2;
    spinner.position.set(0.75, 0, 0);
    rotorGroup.add(spinner);

    // Spinner support ring (Pieza 2: Soporte del cono)
    const spinnerSupportGeo = new THREE.TorusGeometry(0.65, 0.04, 12, 32);
    const supportMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const spinnerSupport = new THREE.Mesh(spinnerSupportGeo, supportMat);
    spinnerSupport.rotation.y = Math.PI / 2;
    spinnerSupport.position.set(0.15, 0, 0);
    rotorGroup.add(spinnerSupport);

    // 3 BLADES (Pieza 3: Pala) + Pitch Bearing (Pieza 4: Cojinete de paso)
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.1,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 3; i++) {
      const bladeGroup = new THREE.Group();
      const angle = (i * 2 * Math.PI) / 3;
      bladeGroup.rotation.x = angle;

      // Pitch bearing ring at blade root
      const pitchRingGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.12, 16);
      const pitchRing = new THREE.Mesh(pitchRingGeo, supportMat);
      pitchRing.position.set(0, 0.65, 0);
      bladeGroup.add(pitchRing);

      // Aerodynamic Blade with twist and taper
      const bladeLength = 6.2;
      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(0, 0);
      bladeShape.quadraticCurveTo(0.28, 1.5, 0.14, bladeLength);
      bladeShape.lineTo(-0.06, bladeLength);
      bladeShape.quadraticCurveTo(-0.16, 2.0, 0, 0);

      const extrudeSettings = {
        steps: 2,
        depth: 0.06,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 3,
      };

      const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
      const bladeMesh = new THREE.Mesh(bladeGeo, bladeMaterial);
      bladeMesh.position.set(0, 0.7, -0.03);
      bladeMesh.rotation.y = 0.15; // aerodynamic pitch angle
      bladeMesh.castShadow = true;
      bladeGroup.add(bladeMesh);

      // Red tip on blades for aviation security & realism
      const tipGeo = new THREE.BoxGeometry(0.12, 0.8, 0.08);
      const tipMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.set(0.04, bladeLength + 0.3, 0);
      bladeGroup.add(tipMesh);

      rotorGroup.add(bladeGroup);
    }

    // Highlighting ring indicator for selected parts
    const highlightGeo = new THREE.RingGeometry(0.3, 0.42, 32);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
    highlightMesh.visible = false;
    scene.add(highlightMesh);

    // 16. WIND PARTICLES (Visualizing airflow and Betz Limit slowing down!)
    const particleCount = 180;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: number[] = [];

    for (let p = 0; p < particleCount; p++) {
      // Wind comes from +X (upwind) towards -X (downwind)
      particlePositions[p * 3] = (Math.random() - 0.5) * 14 + 2; // X
      particlePositions[p * 3 + 1] = 3.1 + (Math.random() - 0.5) * 6; // Y
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 6; // Z
      particleVelocities.push(0.08 + Math.random() * 0.06);
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
    });
    const windParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(windParticles);

    // Camera Orbit controls state
    const spherical = {
      radius: 10,
      theta: 0.8,
      phi: 1.1,
    };

    const targetCameraPos = new THREE.Vector3(7, 4.5, 7);
    const targetLookAt = new THREE.Vector3(0, 3.1, 0);
    const currentLookAt = new THREE.Vector3(0, 3.1, 0);

    animRef.current = {
      scene,
      camera,
      renderer,
      rotorGroup,
      highSpeedShaft,
      anemometerGroup,
      nacelleCanopy,
      nacelleCanopyCap,
      windParticles,
      targetCameraPos,
      targetLookAt,
      currentLookAt,
      highlightMesh,
      reqId: 0,
      isDragging: false,
      prevMouse: { x: 0, y: 0 },
      spherical,
    };

    // MOUSE / TOUCH ORBIT CONTROLS
    const handleMouseDown = (e: MouseEvent) => {
      if (!animRef.current) return;
      animRef.current.isDragging = true;
      animRef.current.prevMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!animRef.current || !animRef.current.isDragging) return;
      const dx = e.clientX - animRef.current.prevMouse.x;
      const dy = e.clientY - animRef.current.prevMouse.y;
      animRef.current.prevMouse = { x: e.clientX, y: e.clientY };

      animRef.current.spherical.theta -= dx * 0.008;
      animRef.current.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, animRef.current.spherical.phi - dy * 0.008));
    };

    const handleMouseUp = () => {
      if (animRef.current) animRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!animRef.current) return;
      animRef.current.spherical.radius = Math.max(3, Math.min(22, animRef.current.spherical.radius + e.deltaY * 0.015));
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    dom.addEventListener("wheel", handleWheel, { passive: false });

    // Touch controls for mobile/tablet
    const handleTouchStart = (e: TouchEvent) => {
      if (!animRef.current || e.touches.length === 0) return;
      animRef.current.isDragging = true;
      animRef.current.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!animRef.current || !animRef.current.isDragging || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - animRef.current.prevMouse.x;
      const dy = e.touches[0].clientY - animRef.current.prevMouse.y;
      animRef.current.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      animRef.current.spherical.theta -= dx * 0.01;
      animRef.current.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, animRef.current.spherical.phi - dy * 0.01));
    };

    const handleTouchEnd = () => {
      if (animRef.current) animRef.current.isDragging = false;
    };

    dom.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    // ANIMATION LOOP
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (animRef.current) {
        const {
          camera,
          rotorGroup,
          highSpeedShaft,
          anemometerGroup,
          windParticles,
          spherical,
          currentLookAt,
          targetLookAt,
          highlightMesh,
        } = animRef.current;

        // Rotation speeds based on windSpeed
        const rotorRps = Math.max(0.05, Math.min(1.5, windSpeed * 0.04));
        rotorGroup.rotation.x += rotorRps * delta * 2 * Math.PI;

        // High speed shaft spins ~60x faster
        highSpeedShaft.rotation.x += rotorRps * 60 * delta;

        // Anemometer cups spin
        anemometerGroup.rotation.y += windSpeed * 0.5 * delta;

        // Animate wind particles flowing through rotor & expanding downstream (Betz limit effect)
        const posAttr = windParticles.geometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          let px = posArray[i * 3];
          let py = posArray[i * 3 + 1];
          let pz = posArray[i * 3 + 2];

          // Upwind speed is fast (v1); downwind of rotor (x < 2) slows down to ~v1/3!
          const speedMultiplier = px > 2.0 ? 1.0 : 0.38; // Betz deceleration
          const moveStep = (windSpeed * 0.4) * particleVelocities[i] * speedMultiplier * delta * 15;
          px -= moveStep;

          // Downwind streamlines expand outwards
          if (px < 2.0 && px > -6.0) {
            py += (py - 3.1) * 0.008;
            pz += pz * 0.008;
          }

          // Reset particle to upwind front
          if (px < -8.0) {
            px = 8.0 + Math.random() * 3.0;
            py = 3.1 + (Math.random() - 0.5) * 5.0;
            pz = (Math.random() - 0.5) * 5.0;
          }

          posArray[i * 3] = px;
          posArray[i * 3 + 1] = py;
          posArray[i * 3 + 2] = pz;
        }
        posAttr.needsUpdate = true;

        // Camera positioning with smooth interpolation
        const cx = currentLookAt.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
        const cy = currentLookAt.y + spherical.radius * Math.cos(spherical.phi);
        const cz = currentLookAt.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);

        camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.08);
        currentLookAt.lerp(targetLookAt, 0.08);
        camera.lookAt(currentLookAt);

        // Highlight ring pulse
        if (highlightMesh.visible) {
          const pulse = 1 + Math.sin(elapsed * 6) * 0.15;
          highlightMesh.scale.set(pulse, pulse, pulse);
          highlightMesh.lookAt(camera.position);
        }

        renderer.render(scene, camera);
      }

      animRef.current!.reqId = requestAnimationFrame(animate);
    };

    animRef.current.reqId = requestAnimationFrame(animate);

    // RESIZE OBSERVER (as requested by instructions)
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !animRef.current) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW > 0 && newH > 0) {
        animRef.current.camera.aspect = newW / newH;
        animRef.current.camera.updateProjectionMatrix();
        animRef.current.renderer.setSize(newW, newH);
      }
    });

    resizeObserver.observe(container);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current.reqId);
      }
      dom.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("wheel", handleWheel);
      dom.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      resizeObserver.disconnect();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
      renderer.dispose();
    };
  }, []);

  // Update X-Ray transparency
  useEffect(() => {
    if (!animRef.current) return;
    const { nacelleCanopy, nacelleCanopyCap } = animRef.current;
    const mat = nacelleCanopy.material as THREE.MeshStandardMaterial;
    mat.opacity = isXRay ? 0.25 : 0.94;
    mat.wireframe = isXRay;
    const matCap = nacelleCanopyCap.material as THREE.MeshStandardMaterial;
    matCap.opacity = isXRay ? 0.25 : 0.94;
  }, [isXRay]);

  // Update wind particle visibility
  useEffect(() => {
    if (!animRef.current) return;
    animRef.current.windParticles.visible = showWindParticles;
  }, [showWindParticles]);

  // Focus camera and highlight on selected part
  useEffect(() => {
    if (!animRef.current) return;
    const { targetLookAt, spherical, highlightMesh } = animRef.current;

    if (selectedPart) {
      targetLookAt.set(selectedPart.threeFocus.x, selectedPart.threeFocus.y + 3.1, selectedPart.threeFocus.z);
      spherical.radius = 5.5;
      spherical.phi = 1.2;
      spherical.theta = 0.9;

      highlightMesh.position.set(
        selectedPart.threeFocus.x,
        selectedPart.threeFocus.y + 3.1,
        selectedPart.threeFocus.z + 0.1
      );
      highlightMesh.visible = true;
    } else {
      highlightMesh.visible = false;
    }
  }, [selectedPart]);

  // Switch camera presets
  const setCameraPreset = (preset: "general" | "nacelle" | "rotor" | "generator") => {
    if (!animRef.current) return;
    setCurrentView(preset);
    const { targetLookAt, spherical } = animRef.current;

    switch (preset) {
      case "general":
        targetLookAt.set(0, 0, 0);
        spherical.radius = 16;
        spherical.phi = 1.3;
        spherical.theta = 0.7;
        break;
      case "nacelle":
        targetLookAt.set(-0.5, 3.1, 0);
        spherical.radius = 6.5;
        spherical.phi = 1.1;
        spherical.theta = 1.1;
        setIsXRay(true);
        break;
      case "rotor":
        targetLookAt.set(2.5, 3.1, 0);
        spherical.radius = 8.0;
        spherical.phi = 1.4;
        spherical.theta = 0.2;
        break;
      case "generator":
        targetLookAt.set(-1.8, 3.1, 0);
        spherical.radius = 4.5;
        spherical.phi = 1.2;
        spherical.theta = 1.3;
        setIsXRay(true);
        break;
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col">
      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Control Bar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* View mode badges */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
          <button
            onClick={() => setCameraPreset("general")}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
              currentView === "general" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setCameraPreset("nacelle")}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
              currentView === "nacelle" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Góndola (Corte)
          </button>
          <button
            onClick={() => setCameraPreset("rotor")}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
              currentView === "rotor" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Rotor
          </button>
          <button
            onClick={() => setCameraPreset("generator")}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
              currentView === "generator" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Generador
          </button>
        </div>

        {/* Feature toggles */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* X-Ray / Cutaway Toggle */}
          <button
            onClick={() => setIsXRay(!isXRay)}
            title="Alternar cubierta transparente / Rayos X"
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border shadow-lg backdrop-blur-md transition-all ${
              isXRay
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                : "bg-slate-900/90 text-slate-300 border-slate-700/60 hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isXRay ? "Corte Rayos X: ON" : "Carcasa Sólida"}</span>
          </button>

          {/* Wind particles toggle */}
          <button
            onClick={() => setShowWindParticles(!showWindParticles)}
            title="Mostrar u ocultar partículas de viento"
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border shadow-lg backdrop-blur-md transition-all ${
              showWindParticles
                ? "bg-sky-500/20 text-sky-300 border-sky-500/50"
                : "bg-slate-900/90 text-slate-400 border-slate-700/60 hover:bg-slate-800"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Viento {windSpeed} m/s</span>
          </button>
        </div>
      </div>

      {/* Selected 3D part overlay banner */}
      {selectedPart && (
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 border border-emerald-500/50 backdrop-blur-md p-3 rounded-xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-bold text-sm flex items-center justify-center shrink-0">
              {selectedPart.id}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{selectedPart.name}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedPart.categoryLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1">{selectedPart.shortDescription}</p>
            </div>
          </div>
          <button
            onClick={() => onSelectPart && onSelectPart(selectedPart)}
            className="text-xs font-semibold px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shrink-0 transition-colors"
          >
            Detalle Técnico
          </button>
        </div>
      )}

      {/* Helper hint */}
      <div className="absolute bottom-3 right-3 pointer-events-none text-[10px] text-slate-400/80 bg-slate-950/60 px-2 py-0.5 rounded-md">
        Arrastra para orbitar 360° • Scroll para zoom
      </div>
    </div>
  );
};
