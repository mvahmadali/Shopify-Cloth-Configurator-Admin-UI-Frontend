import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import PropTypes from 'prop-types';
import './ModelViewer.css';

function ModelViewer({ modelUrl, label = 'Model Viewer' }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!modelUrl || !containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 2);
    cameraRef.current = camera;

    // Renderer setup with alpha for transparency
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Transparent
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - Professional 3-point lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Key light (main directional light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(8, 6, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Fill light (softer, from opposite side)
    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.6);
    fillLight.position.set(-6, 4, -8);
    scene.add(fillLight);

    // Back light (rim light for definition)
    const backLight = new THREE.DirectionalLight(0xff88ff, 0.5);
    backLight.position.set(0, 8, -10);
    scene.add(backLight);

    // Add point light for depth
    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Add OrbitControls for interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 3;

    // Load model with DRACO support
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        
        // Adjust model to fit camera
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        camera.position.z = cameraZ * 1.1;
        camera.lookAt(center);

        model.position.sub(center);
        scene.add(model);

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
      }
    );

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelUrl]);

  return (
    <div className="model-viewer-container">
      <h4>{label}</h4>
      <div ref={containerRef} className="model-viewer" />
    </div>
  );
}

ModelViewer.propTypes = {
  modelUrl: PropTypes.string,
  label: PropTypes.string
};

export default ModelViewer;
