import { useEffect, useRef } from "react";
import * as THREE from "three";

const AnimatedBackground = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 28;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x1c1f23, 0.6);
    scene.add(ambientLight);

    const orangeLight = new THREE.PointLight(0xf97316, 1.3, 120);
    orangeLight.position.set(14, 10, 30);
    scene.add(orangeLight);

    const greenLight = new THREE.PointLight(0x3f6212, 1.1, 110);
    greenLight.position.set(-16, -12, 25);
    scene.add(greenLight);

    const geometry = new THREE.IcosahedronGeometry(10, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x101316,
      roughness: 0.42,
      metalness: 0.48,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const edges = new THREE.EdgesGeometry(geometry);
    const wireframe = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x3f6212, linewidth: 1 })
    );
    mesh.add(wireframe);

    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    // Sprinkle subtle particles like Lagos night lights
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xf97316,
      size: 0.25,
      transparent: true,
      opacity: 0.6,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    orbitGroup.add(particles);

    let animationFrame = 0;

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const animate = () => {
      mesh.rotation.x += 0.0025;
      mesh.rotation.y += 0.0018;
      wireframe.rotation.z += 0.0015;
      orbitGroup.rotation.y += 0.0009;
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onResize);
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      edges.dispose();
      (wireframe.material as THREE.Material).dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="animated-background" ref={mountRef} aria-hidden="true" />
  );
};

export default AnimatedBackground;
