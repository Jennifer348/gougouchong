import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store/gameStore";
import { ANIMALS, MORANDI_COLORS, ILLUSTRATIONS } from "../utils/constants";
import "./CardPool.css";

const deterministicShuffle = (array, seed) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor((seed * (i + 1)) % (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
    seed = (seed * 9301 + 49297) % 233280;
  }
  return arr;
};

function Card({ card, isHovered, isSelected, hoveredId, mouseX, mouseY, cardRef }) {
  // When selected, card is centered with z-index 100
  // When hovered (but not selected), card has z-index 999 and opacity 1
  // When not hovered/selected, card has original z-index and opacity 0.4
  const selectedY = isSelected ? 0 : undefined;
  const selectedRotate = isSelected ? card.angle : undefined;
  const selectedZIndex = isSelected ? 100 : (isHovered ? 999 : card.zIndex);
  const opacity = !hoveredId || isHovered || isSelected ? 1 : 0.4;

  // Torn edge mask for photos - cycle through 3 different masks per card
  const tornMasks = [
    '/assets/torn-edge-mask-sharp-1.png',
    '/assets/torn-edge-mask-sharp-2.png',
    '/assets/torn-edge-mask-sharp-3.png',
  ];
  const maskUrl = tornMasks[card.id % tornMasks.length];

  // Magnified dock effect: scale based on distance from mouse
  let magnifiedScale = 1;
  if (mouseX !== null && mouseY !== null && cardRef && cardRef.current) {
    const bounds = cardRef.current.getBoundingClientRect();
    const cardCenterX = bounds.left + bounds.width / 2;
    const cardCenterY = bounds.top + bounds.height / 2;

    const distX = mouseX - cardCenterX;
    const distY = mouseY - cardCenterY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    // Magnification parameters
    const maxDistance = 300; // distance at which scale returns to 1
    const maxScale = 1.4; // maximum scale factor

    if (distance < maxDistance) {
      // Smooth easing: max scale at center, 1 at maxDistance
      magnifiedScale = 1 + (maxScale - 1) * (1 - distance / maxDistance);
    }
  }

  const selectedScale = isSelected ? 1 : magnifiedScale;

  return (
    <motion.div
      ref={cardRef}
      className="card-hover-zone"
      initial={{
        opacity: 1,
        x: card.xOffset,
        y: card.yOffset,
        rotate: card.angle,
        scale: 0.8,
        zIndex: card.zIndex,
      }}
      animate={{
        x: isSelected ? 0 : card.xOffset,
        y: selectedY !== undefined ? selectedY : card.yOffset,
        scale: selectedScale,
        rotate: selectedRotate !== undefined ? selectedRotate : card.angle,
        zIndex: selectedZIndex,
        opacity: opacity,
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.2 },
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        mass: 1,
        zIndex: { delay: 0 },
        opacity: { duration: 0.2 },
      }}
      style={{
        "--card-color": card.color,
        "--torn-mask-url": card.frontImage ? `url(${maskUrl})` : 'none',
        willChange: "transform, z-index, opacity",
      }}
      onClick={() => !isSelected && onCardClick(card)}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`card-wrapper ${card.frontImage ? "card-image" : ""}`}>
        <div className="card">
          <img
            src={card.frontImage}
            alt="front"
            className="card-image-content"
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function CardPool() {
  const selectCard = useGameStore((state) => state.selectCard);
  const cardsRef = useRef(null);
  const containerRef = useRef(null);
  const cardRefsMap = useRef({});
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [mousePos, setMousePos] = useState({ x: null, y: null });

  // Initialize cards once
  if (!cardsRef.current) {
    const sessionSeed = Math.floor(Date.now() / 1000) % 10000;
    const colors = deterministicShuffle(MORANDI_COLORS, sessionSeed);
    const colorsToUse = [...colors];

    while (colorsToUse.length < 6) {
      colorsToUse.push(colors[colorsToUse.length % colors.length]);
    }

    const generateCards = () => {
      const numCards = 7;
      const maxAngle = 8;
      const horizontalSpacing = 145;

      const shuffledIllustrations = [...ILLUSTRATIONS].sort(
        () => Math.random() - 0.5
      );
      const backTextures = [
        '/assets/kraft/texture1.jpg',
        '/assets/kraft/texture2.jpg',
        '/assets/kraft/texture3.jpg',
        '/assets/kraft/texture4.jpg',
        '/assets/kraft/texture5.jpg',
      ];

      return Array.from({ length: numCards }, (_, i) => {
        const angle = (i / (numCards - 1)) * (maxAngle * 2) - maxAngle;
        const xOffset = i * horizontalSpacing - (numCards - 1) * horizontalSpacing / 2;
        const centerIndex = (numCards - 1) / 2;
        const distanceFromCenter = i - centerIndex;
        const curveIntensity = 42;
        const yOffset = Math.pow(distanceFromCenter, 2) * (curveIntensity / Math.pow(centerIndex, 2));
        const zIndex = i;

        return {
          id: i,
          animal: ANIMALS[i % ANIMALS.length],
          color: colorsToUse[i],
          angle,
          xOffset,
          yOffset,
          zIndex,
          frontImage: shuffledIllustrations[i],
          backTexture: backTextures[i % backTextures.length],
        };
      });
    };

    cardsRef.current = generateCards();
  }

  const cards = cardsRef.current;

  const handleCardClick = (card) => {
    setSelectedCardId(card.id);
    setTimeout(() => {
      selectCard(card);
    }, 800);
  };

  // Get topmost hovered card based on z-index priority
  // Sorts cards by z-index descending and returns the first card that contains the cursor
  const getTopmostHoveredCard = (mouseX, mouseY) => {
    if (!containerRef.current) return null;

    const containerBounds = containerRef.current.getBoundingClientRect();

    // Check if cursor is within container bounds
    if (mouseX < containerBounds.left || mouseX > containerBounds.right ||
        mouseY < containerBounds.top || mouseY > containerBounds.bottom) {
      return null;
    }

    // Sort cards by z-index descending (highest z-index first)
    const sortedCards = [...cards].sort((a, b) => b.zIndex - a.zIndex);

    // Check each card from highest to lowest z-index
    for (const card of sortedCards) {
      const cardElement = cardRefsMap.current[card.id];

      if (cardElement) {
        const bounds = cardElement.getBoundingClientRect();

        // Check if cursor is within this card's bounds
        if (mouseX >= bounds.left && mouseX <= bounds.right &&
            mouseY >= bounds.top && mouseY <= bounds.bottom) {
          return card.id;
        }
      }
    }

    return null;
  };

  const handleMouseMove = (e) => {
    const topmostCard = getTopmostHoveredCard(e.clientX, e.clientY);
    setHoveredId(topmostCard);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    setMousePos({ x: null, y: null });
  };

  return (
    <div
      className="card-pool"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-fan-container">
        <AnimatePresence mode="sync">
          {cards.map((card) => {
            const isSelected = selectedCardId === card.id;
            const isHovered = hoveredId === card.id;
            return (
              <Card
                key={card.id}
                card={card}
                isHovered={isHovered}
                isSelected={isSelected}
                hoveredId={hoveredId}
                mouseX={mousePos.x}
                mouseY={mousePos.y}
                onCardClick={handleCardClick}
                cardRef={(ref) => {
                  if (ref) {
                    cardRefsMap.current[card.id] = ref;
                  }
                }}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
