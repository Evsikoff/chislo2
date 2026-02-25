'use client';

import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MeshDistortMaterial, Text, Float, Sparkles, Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';

function GameEnvironment({ feedback, target, guess }: { feedback: string; target: number; guess: number }) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  // Target values for smooth interpolation
  const targetColor = useRef(new THREE.Color('#8b5cf6')); // Default purple
  const targetDistort = useRef(0.3);
  const targetSpeed = useRef(1);
  const targetScale = useRef(1);

  useEffect(() => {
    if (feedback === 'Слишком много') {
      targetColor.current.set('#ef4444'); // Red
      targetDistort.current = 0.8;
      targetSpeed.current = 4;
      targetScale.current = 1.5;
    } else if (feedback === 'Слишком мало') {
      targetColor.current.set('#3b82f6'); // Blue
      targetDistort.current = 0.1;
      targetSpeed.current = 0.5;
      targetScale.current = 0.7;
    } else if (feedback === 'В цель!') {
      targetColor.current.set('#eab308'); // Gold
      targetDistort.current = 0.5;
      targetSpeed.current = 6;
      targetScale.current = 1.2;
    } else {
      targetColor.current.set('#8b5cf6'); // Purple
      targetDistort.current = 0.3;
      targetSpeed.current = 1;
      targetScale.current = 1;
    }
  }, [feedback]);

  useFrame((state, delta) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x += delta * 0.2;
      sphereRef.current.rotation.y += delta * 0.3;
      
      // Smoothly interpolate scale
      sphereRef.current.scale.lerp(new THREE.Vector3(targetScale.current, targetScale.current, targetScale.current), 0.05);
    }
    
    if (materialRef.current) {
      // Smoothly interpolate material properties
      materialRef.current.color.lerp(targetColor.current, 0.05);
      materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, targetDistort.current, 0.05);
      materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, targetSpeed.current, 0.05);
    }
  });

  let currentColorStr = '#8b5cf6';
  if (feedback === 'Слишком много') currentColorStr = '#ef4444';
  else if (feedback === 'Слишком мало') currentColorStr = '#3b82f6';
  else if (feedback === 'В цель!') currentColorStr = '#eab308';

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={sphereRef} castShadow receiveShadow>
          <sphereGeometry args={[1.5, 64, 64]} />
          <MeshDistortMaterial
            ref={materialRef}
            color="#8b5cf6"
            envMapIntensity={1}
            clearcoat={1}
            clearcoatRoughness={0.1}
            metalness={0.5}
            roughness={0.2}
            distort={0.3}
            speed={1}
          />
        </mesh>
      </Float>

      {/* Floating particles */}
      <Sparkles count={100} scale={10} size={4} speed={0.4} opacity={0.5} color={currentColorStr} />
      <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      
      {/* 3D Text Feedback */}
      {feedback && (
        <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5}>
          <Text
            position={[0, 3, 0]}
            fontSize={0.8}
            color={currentColorStr}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {feedback}
          </Text>
        </Float>
      )}
    </>
  );
}

export default function NumberGuesser() {
  const [targetNumber, setTargetNumber] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [history, setHistory] = useState<{guess: number, feedback: string}[]>([]);
  const [isClient, setIsClient] = useState(false);

  const startNewGame = () => {
    setTargetNumber(Math.floor(Math.random() * 100) + 1);
    setGuess('');
    setFeedback('');
    setAttempts(0);
    setHistory([]);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    startNewGame();
  }, []);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const numGuess = parseInt(guess, 10);
    
    if (isNaN(numGuess) || numGuess < 1 || numGuess > 100) {
      setFeedback('Введите число от 1 до 100');
      return;
    }

    setAttempts(prev => prev + 1);

    let currentFeedback = '';
    if (numGuess > targetNumber) {
      currentFeedback = 'Слишком много';
    } else if (numGuess < targetNumber) {
      currentFeedback = 'Слишком мало';
    } else {
      currentFeedback = 'В цель!';
    }

    setFeedback(currentFeedback);
    setHistory(prev => [{ guess: numGuess, feedback: currentFeedback }, ...prev]);
    setGuess('');
  };

  if (!isClient) return null;

  return (
    <div className="relative w-full h-screen bg-neutral-950 overflow-hidden text-neutral-100 font-sans">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <GameEnvironment feedback={feedback} target={targetNumber} guess={parseInt(guess) || 0} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl pointer-events-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
              Угадай число
            </h1>
            <p className="text-neutral-400 text-sm">
              Компьютер загадал число от 1 до 100
            </p>
          </div>

          <form onSubmit={handleGuess} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="number"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Ваше число..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-2xl text-center focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-neutral-600"
                disabled={feedback === 'В цель!'}
                min="1"
                max="100"
                autoFocus
              />
            </div>

            {feedback !== 'В цель!' ? (
              <button
                type="submit"
                className="w-full bg-white text-black font-medium py-4 rounded-2xl hover:bg-neutral-200 transition-colors active:scale-[0.98]"
              >
                Проверить
              </button>
            ) : (
              <button
                type="button"
                onClick={startNewGame}
                className="w-full bg-yellow-500 text-black font-medium py-4 rounded-2xl hover:bg-yellow-400 transition-colors active:scale-[0.98]"
              >
                Играть снова
              </button>
            )}
          </form>

          {/* Stats & History */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex justify-between text-sm text-neutral-400 mb-4">
              <span>Попыток: {attempts}</span>
              {history.length > 0 && (
                <span>Последнее: {history[0].guess}</span>
              )}
            </div>
            
            <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              <AnimatePresence>
                {history.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center text-sm py-2 px-3 rounded-lg bg-white/5"
                  >
                    <span className="font-mono text-neutral-300">{item.guess}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.feedback === 'Слишком много' ? 'bg-red-500/20 text-red-400' :
                      item.feedback === 'Слишком мало' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.feedback}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
