import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store/gameStore";
import { ANIMALS, MORANDI_COLORS, ILLUSTRATIONS } from "../utils/constants";
import rough from "roughjs";
import ComplimentRoulette from "../components/ComplimentRoulette";
import "./CardFlip.css";

// Ask Me Anything question bank
const AMQ_QUESTIONS = [
  // 1-10 日常向
  "What's one small thing I do that you didn't expect to love this much?",
  "If we could teleport somewhere for just 2 hours right now, where would you pick?",
  "What's something you thought about today that made you smile?",
  "Describe your perfect Sunday if I were there.",
  "What's a song that reminds you of me lately?",
  "If you had to describe our relationship as a weather forecast, what would today's be?",
  "What's something you've never told me but want to?",
  "What do you miss most about being in the same city as me?",
  "If I showed up at your door right now, what would we do first?",
  "What's one thing you're proud of yourself for this week?",
  // 11-16 暧昧/撩人向
  "What's the first thing you'd do if I walked through your door right now?",
  "What have you been thinking about doing to me the next time we're together?",
  "What's something you find irresistibly attractive about me that you haven't said out loud?",
  "If I could only wear one thing the next time you see me, what would you pick?",
  "What's a memory of us that you replay when you're missing me?",
  "Be honest — what's the naughtiest thought you've had about me this week?"
];

// Cursor follow image - renders via Portal to escape 3D transform inheritance
function CursorFollowImage({ visible, cursorPos }) {
  if (!visible) return null;

  return createPortal(
    <img
      src="/no-cursor.jpg"
      alt="no-meme"
      style={{
        position: 'fixed',
        left: `${cursorPos.x}px`,
        top: `${cursorPos.y - 75}px`,
        width: '75px',
        height: '75px',
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'none',
        objectFit: 'cover',
        borderRadius: '4px',
      }}
    />,
    document.body
  );
}

// Rough button component with hand-drawn border
function RoughButton({ label, onClick, onMouseEnter, onMouseLeave }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Create rough canvas and draw rectangle
    const rc = rough.svg(svg);

    // Clear previous drawings
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Draw hand-drawn rectangle with hachure style
    const width = label === "Yes!" ? 120 : 90;
    const height = 50;

    rc.rectangle(4, 4, width - 8, height - 8, {
      stroke: "#333",
      strokeWidth: 2,
      roughness: 1.5,
      bowing: 1,
      hachureGap: 4,
      hachureAngle: 45,
    });
  }, [label]);

  return (
    <motion.button
      className="rough-button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.98 }}
      style={{
        width: label === "Yes!" ? "120px" : "90px",
        height: "50px",
        position: "relative",
      }}
    >
      <svg
        ref={svgRef}
        width={label === "Yes!" ? "120" : "90"}
        height="50"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />
      <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
    </motion.button>
  );
}

// Helper: Deterministic shuffle
const deterministicShuffle = (array, seed) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor((seed * (i + 1)) % (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
    seed = (seed * 9301 + 49297) % 233280;
  }
  return arr;
};

// Card component - handles 3D flip
function CardFlipContainer({ card, isSelected, isFlipped, onFlipComplete, onYesClick }) {
  const [showCursorImage, setShowCursorImage] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const handleNoMouseEnter = () => {
    setShowCursorImage(true);
  };

  const handleNoMouseLeave = () => {
    setShowCursorImage(false);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <motion.div
        className="flip-container"
        animate={{
          rotateY: isFlipped ? 180 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 80,
          damping: 20,
        }}
        onAnimationComplete={onFlipComplete}
        style={{
          perspective: 1000,
        }}
      >
      {/* Front: Photo */}
      <motion.div
        className="flip-face flip-front"
        style={{
          backfaceVisibility: "hidden",
        }}
      >
        <img src={card.frontImage} alt="card-front" className="card-img" />
      </motion.div>

      {/* Back: Kraft paper with text */}
      <motion.div
        className="flip-face flip-back"
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        }}
      >
        <div className="card-back-content">
          <p className="greeting">Hi Bowen</p>
          <p className="back-text">Can I invite you for a date?</p>
          <div className="button-group">
            <RoughButton label="Yes!" onClick={onYesClick} />
            <RoughButton
              label="No"
              onClick={() => console.log("No")}
              onMouseEnter={handleNoMouseEnter}
              onMouseLeave={handleNoMouseLeave}
            />
          </div>
          <p className="ref-number">REF {card.refNumber}</p>
        </div>
      </motion.div>

    </motion.div>

    {/* Cursor follow image - rendered via Portal to escape flip transform */}
    <CursorFollowImage visible={showCursorImage} cursorPos={cursorPos} />
  </>
  );
}

// Second question component
function SecondQuestionScreen({ onChoose, onBack }) {
  const choices = [
    { emoji: "🎬", text: "Do something together" },
    { emoji: "💬", text: "Express to me" },
    { emoji: "🎁", text: "Surprise me" },
  ];

  return (
    <motion.div
      className="second-question-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.button
        className="back-arrow-button"
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        ‹
      </motion.button>
      <div className="question-content">
        <p className="question-text">What do you want to do?</p>
        <div className="choices-container">
          {choices.map((choice, index) => (
            <motion.button
              key={index}
              className="choice-button"
              onClick={() => onChoose(choice.text)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
              whileHover={{ scale: 1.05, x: 10 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="choice-emoji">{choice.emoji}</span>
              <span className="choice-text">{choice.text}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Third question component - shows options based on the selected category
function ThirdQuestionScreen({ category, onChoose, onBack }) {
  const optionsByCategory = {
    "Do something together": [
      "Watch a film together",
      "Same playlist same hour",
      "Plan a date with me",
    ],
    "Express to me": [
      "Send a selfie",
      "Ask me anything",
      "Compliment roulette",
    ],
    "Surprise me": [
      "V 我5.20",
    ],
  };

  const options = optionsByCategory[category] || [];

  return (
    <motion.div
      className="second-question-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.button
        className="back-arrow-button"
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        ‹
      </motion.button>
      <div className="question-content">
        <p className="question-text">{category}</p>
        <div className="choices-container">
          {options.map((option, index) => (
            <motion.button
              key={index}
              className="choice-button"
              onClick={() => onChoose(option)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
              whileHover={{ scale: 1.05, x: 10 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="choice-text">{option}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Plan a date activity
function PlanDateActivity({ onBack }) {
  const [where, setWhere] = useState("");
  const [whatToEat, setWhatToEat] = useState("");
  const [daysUntil, setDaysUntil] = useState("");
  const [promised, setPromised] = useState(false);

  const invitationText = `📍 Let's go to ${where}
🍽️ And eat ${whatToEat}
📅 Only ${daysUntil} days until I see you!

I promise I'll dress nice for this date 💕`;

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Date Invitation 💌");
    const body = encodeURIComponent(invitationText);
    window.location.href = `mailto:jennifer172624@gmail.com?subject=${subject}&body=${body}`;
  };

  const copyForWeChat = async () => {
    try {
      await navigator.clipboard.writeText(invitationText);
      alert("已复制！打开微信粘贴发给TA吧 📋");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const isComplete = where.trim() && whatToEat.trim() && daysUntil && promised;

  return (
    <motion.div
      className="plan-date-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.button
        className="back-arrow-button"
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        ‹
      </motion.button>

      <div className="plan-date-content">
        <motion.h2
          className="plan-date-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Plan a date with me 📍
        </motion.h2>

        <motion.div
          className="plan-date-inputs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="input-field">
            <label>Where should we go?</label>
            <input
              type="text"
              className="plan-input"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="Type a place..."
            />
          </div>

          <div className="input-field">
            <label>What do you want to eat?</label>
            <input
              type="text"
              className="plan-input"
              value={whatToEat}
              onChange={(e) => setWhatToEat(e.target.value)}
              placeholder="Type food..."
            />
          </div>

          <div className="input-field">
            <label>How many days until we see each other?</label>
            <input
              type="number"
              className="plan-input"
              value={daysUntil}
              onChange={(e) => setDaysUntil(e.target.value)}
              placeholder="Type a number..."
              min="0"
            />
          </div>

          <label className="promise-checkbox">
            <input
              type="checkbox"
              checked={promised}
              onChange={(e) => setPromised(e.target.checked)}
            />
            <span>I promise I'll dress nice for this date 👗</span>
          </label>
        </motion.div>

        <motion.div
          className="plan-date-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            className="plan-btn email-btn"
            onClick={shareViaEmail}
            disabled={!isComplete}
            whileHover={isComplete ? { scale: 1.05 } : {}}
            whileTap={isComplete ? { scale: 0.98 } : {}}
          >
            Send via Email 💌
          </motion.button>
          <motion.button
            className="plan-btn wechat-btn"
            onClick={copyForWeChat}
            disabled={!isComplete}
            whileHover={isComplete ? { scale: 1.05 } : {}}
            whileTap={isComplete ? { scale: 0.98 } : {}}
          >
            Copy for WeChat 💬
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Film input screen component
function FilmInputScreen({ onConfirm, onBack }) {
  const [filmName, setFilmName] = useState("");

  return (
    <motion.div
      className="second-question-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.button
        className="back-arrow-button"
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        ‹
      </motion.button>
      <div className="question-content">
        <p className="question-text">Type which film you want to watch</p>
        <div className="film-input-container">
          <input
            type="text"
            className="film-input"
            placeholder=""
            value={filmName}
            onChange={(e) => setFilmName(e.target.value)}
            autoFocus
          />
          {filmName && (
            <motion.button
              className="checkmark-button"
              onClick={() => onConfirm(filmName)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              ✓
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Time input screen component
function TimeInputScreen({ filmName, onConfirm, onBack }) {
  const [time, setTime] = useState("");

  return (
    <motion.div
      className="second-question-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.button
        className="back-arrow-button"
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        ‹
      </motion.button>
      <div className="question-content">
        <p className="question-text">When do you want to watch with Jennifer?</p>
        <div className="film-input-container">
          <input
            type="text"
            className="film-input"
            placeholder=""
            value={time}
            onChange={(e) => setTime(e.target.value)}
            autoFocus
          />
          {time && (
            <motion.button
              className="checkmark-button"
              onClick={() => onConfirm(time)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              ✓
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Invitation screen with typewriter effect
function InvitationScreen({ filmName, time, onSendClick, onBack }) {
  const [displayedText, setDisplayedText] = useState("");
  const [showSendButton, setShowSendButton] = useState(false);

  const fullText = `Dear Jennifer,\n\nWould you like to watch ${filmName} with me at ${time}?\n\nBest,\nBowen`;

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        setShowSendButton(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [filmName, time]);

  return (
    <motion.div
      className="invitation-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.button
        className="back-arrow-button"
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        ‹
      </motion.button>
      <div className="invitation-content">
        <p className="invitation-text">{displayedText}</p>
        <AnimatePresence>
          {showSendButton && (
            <motion.button
              className="send-button"
              onClick={onSendClick}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Send it to her
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Email sent confirmation screen
function EmailSentScreen({ onBackToDashboard }) {
  return (
    <motion.div
      className="email-sent-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="email-sent-content">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <p className="sent-emoji">✓</p>
        </motion.div>
        <p className="sent-text">Email sent!</p>
        <motion.button
          className="dashboard-button"
          onClick={onBackToDashboard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Back to dashboard
        </motion.button>
      </div>
    </motion.div>
  );
}

// Payment warning screen
function PaymentWarningScreen({ onConfirm, onReport, onUnsure }) {
  return (
    <motion.div
      className="payment-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="payment-modal"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <p className="payment-warning">⚠️ 国家反诈中心提醒您</p>
        <p className="payment-text">检测到您即将进行一笔可疑转账</p>
        <div className="payment-details">
          <p>
            收款人：<span className="payment-name">喵喵宣</span>
          </p>
          <p>
            金额：<span className="payment-amount">¥5.20</span>
          </p>
          <p>
            风险等级：<span className="payment-risk">💕💕💕💕💕</span>
            <span className="payment-risk-text">满级心动</span>
          </p>
        </div>

        <div className="payment-buttons">
          <motion.button
            className="payment-btn confirm-btn"
            onClick={onConfirm}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            确定
          </motion.button>
          <motion.button
            className="payment-btn report-btn"
            onClick={onReport}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            举报
          </motion.button>
          <motion.button
            className="payment-btn unsure-btn"
            onClick={onUnsure}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            不确定
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Payment response screen
function PaymentResponseScreen({ type, onClose, onFinalConfirm }) {
  const responses = {
    confirm:
      "转账成功！系统备注：这笔钱买不到我，但是买到了一个喵喵的亲亲！",
    report: "举报成功！系统判定：此人是你唯一的例外，反诈失败",
    unsure: "不确定？那再看看她的照片。",
  };

  return (
    <motion.div
      className="payment-response-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        className="payment-response-modal"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="response-text">{responses[type]}</p>
        {type === "confirm" && (
          <motion.div
            className="photo-preview"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <img
              src="/assets/meme-success.jpg"
              alt="Success"
              className="jennifer-photo-full"
            />
          </motion.div>
        )}
        {type === "unsure" && (
          <motion.div
            className="photo-preview"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <img
              src="/assets/jennifer-photo.png"
              alt="Jennifer"
              className="jennifer-photo-full"
            />
          </motion.div>
        )}
        {type === "report" && (
          <motion.button
            className="close-response-btn"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            好的
          </motion.button>
        )}
        {type === "confirm" && (
          <motion.button
            className="close-response-btn"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            好的
          </motion.button>
        )}
        {type === "unsure" && (
          <motion.button
            className="close-response-btn force-confirm"
            onClick={onFinalConfirm}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            我确定了！
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

// Playlist share screen
function PlaylistShareScreen({ onBack }) {
  const openNetEaseMusic = () => {
    // Try to open NetEase Music app, fallback to web
    const deepLink = "netease://";
    const webLink = "https://music.163.com";

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = deepLink;
      setTimeout(() => {
        window.location.href = webLink;
      }, 500);
    } else {
      window.open(webLink, "_blank");
    }
  };

  const openQQMusic = () => {
    // Try to open QQ Music app, fallback to web
    const deepLink = "qqmusic://";
    const webLink = "https://y.qq.com";

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = deepLink;
      setTimeout(() => {
        window.location.href = webLink;
      }, 500);
    } else {
      window.open(webLink, "_blank");
    }
  };

  return (
    <motion.div
      className="second-question-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.button
        className="back-arrow-button"
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        ‹
      </motion.button>
      <div className="question-content">
        <p className="question-text">Share your playlist with me</p>
        <p className="playlist-subtitle">Go to your favorite music app and share a playlist you want us to listen to together at the same hour</p>
        <div className="music-apps-container">
          <motion.button
            className="music-app-btn netease-btn"
            onClick={openNetEaseMusic}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            whileHover={{ scale: 1.05, x: 10 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="app-emoji">♫</span>
            <span className="app-name">NetEase Music<br/>(网易云)</span>
          </motion.button>
          <motion.button
            className="music-app-btn qq-btn"
            onClick={openQQMusic}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileHover={{ scale: 1.05, x: 10 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="app-emoji">♪</span>
            <span className="app-name">QQ Music<br/>(QQ音乐)</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Ask Me Anything screen - integrated into Express to me flow
function AskMeAnythingScreen({ onBack }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    // Pick random question on mount
    const randomIndex = Math.floor(Math.random() * AMQ_QUESTIONS.length);
    setCurrentQuestion(AMQ_QUESTIONS[randomIndex]);
  }, []);

  const shareViaWeChat = async () => {
    const message = answer.trim()
      ? `Q: ${currentQuestion}\n\nA: ${answer}\n\nfrom gougouchong.site`
      : `Q: ${currentQuestion}\n\nfrom gougouchong.site`;
    try {
      await navigator.clipboard.writeText(message);
      alert("问题已复制到剪贴板，打开微信粘贴发送给TA吧 📋");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareViaWhatsApp = () => {
    const message = answer.trim()
      ? `Q: ${currentQuestion}\n\nA: ${answer}\n\nfrom gougouchong.site`
      : `Q: ${currentQuestion}\n\nfrom gougouchong.site`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
    navigator.clipboard.writeText(message);
  };

  const shareViaiMessage = () => {
    const message = answer.trim()
      ? `Q: ${currentQuestion}\n\nA: ${answer}\n\nfrom gougouchong.site`
      : `Q: ${currentQuestion}\n\nfrom gougouchong.site`;
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `sms:&body=${encodedMessage}`;
    navigator.clipboard.writeText(message);
  };

  if (!currentQuestion) return null;

  return (
    <motion.div
      className="amq-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.button
        className="back-arrow-button"
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        ‹
      </motion.button>

      <div className="amq-content">
        <motion.p
          className="amq-question"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {currentQuestion}
        </motion.p>

        <motion.div
          className="amq-input-group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <input
            type="text"
            className="amq-input"
            placeholder="Type your answer here (optional)..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            autoFocus
          />
        </motion.div>

        <motion.div
          className="amq-share-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="share-label">Share this question:</p>
          <div className="share-buttons">
            <motion.button
              className="share-btn wechat"
              onClick={shareViaWeChat}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Copy to clipboard and paste in WeChat"
            >
              <span className="share-icon">💬</span>
              <span>WeChat</span>
            </motion.button>
            <motion.button
              className="share-btn whatsapp"
              onClick={shareViaWhatsApp}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="share-icon">💚</span>
              <span>WhatsApp</span>
            </motion.button>
            <motion.button
              className="share-btn imessage"
              onClick={shareViaiMessage}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="share-icon">💬</span>
              <span>iMessage</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Selfie camera screen
function SelfieScreen({ onBack, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/jpeg");
      setCapturedImage(imageData);
      setIsCameraActive(false);
      stopCamera();
    }
  };

  const downloadImage = () => {
    if (capturedImage) {
      const link = document.createElement("a");
      link.href = capturedImage;
      link.download = "selfie.jpg";
      link.click();
    }
  };

  const shareToiMessage = () => {
    if (capturedImage) {
      // Create a mailto link with iMessage
      const subject = "Check out this selfie! 📸";
      const body = "I took this selfie for you!";
      const mailtoLink = `sms:jennifer172624@gmail.com&body=${encodeURIComponent(body)}`;

      // For web, we can't directly send images via iMessage, so we'll use Share API
      if (navigator.share) {
        navigator.share({
          title: "My Selfie",
          text: "Check out this selfie!",
          files: [
            new File(
              [dataURItoBlob(capturedImage)],
              "selfie.jpg",
              { type: "image/jpeg" }
            ),
          ],
        });
      } else {
        // Fallback: open iMessage with text
        window.open(`sms:?body=${encodeURIComponent(body)}`, "_blank");
      }
    }
  };

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].match(/:(.*?);/)[1];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <motion.div
      className="selfie-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.button
        className="back-arrow-button"
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        ‹
      </motion.button>

      <div className="selfie-content">
        {!capturedImage ? (
          <>
            <div className="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-feed"
              />
            </div>
            <motion.button
              className="capture-button"
              onClick={capturePhoto}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Capture
            </motion.button>
          </>
        ) : (
          <>
            <div className="captured-image-container">
              <img src={capturedImage} alt="selfie" className="captured-image" />
            </div>
            <div className="action-buttons">
              <motion.button
                className="action-btn save-btn"
                onClick={downloadImage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                Save image
              </motion.button>
              <motion.button
                className="action-btn share-btn"
                onClick={shareToiMessage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                Share
              </motion.button>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </motion.div>
  );
}

// Main flip page
export default function CardFlip() {
  const [cards, setCards] = useState(() => {
    const sessionSeed = Math.floor(Date.now() / 1000) % 10000;
    const colors = deterministicShuffle(MORANDI_COLORS, sessionSeed);
    const colorsToUse = [...colors];

    while (colorsToUse.length < 7) {
      colorsToUse.push(colors[colorsToUse.length % colors.length]);
    }

    return ILLUSTRATIONS.map((img, i) => ({
      id: i,
      frontImage: img,
      color: colorsToUse[i],
      refNumber: 19 + i * 12, // REF 19, 31, 42, etc.
    }));
  });

  const [state, setState] = useState("selecting"); // selecting -> ... -> ask_me_anything
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [mousePos, setMousePos] = useState({ x: null, y: null });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const containerRef = React.useRef(null);

  // Handle card selection - move to center phase
  const handleCardClick = (card) => {
    setSelectedCard(card);
    setState("centering");
    setHoveredId(null); // Reset hover state
  };

  // Back button
  const handleBack = () => {
    setState("selecting");
    setSelectedCard(null);
    setHoveredId(null);
  };

  // Handle Yes button click
  const handleYes = () => {
    setState("question");
  };

  // Handle back from question to card flip
  const handleBackFromQuestion = () => {
    setState("flipped");
    setSelectedCategory(null);
  };

  // Handle back from subquestion to question
  const handleBackFromSubquestion = () => {
    setState("question");
    setSelectedCategory(null);
  };

  // Handle back from film input to subquestion
  const handleBackFromFilmInput = () => {
    setState("subquestion");
    setSelectedFilm(null);
  };

  // Handle back from time input to film input
  const handleBackFromTimeInput = () => {
    setState("film_input");
    setSelectedTime(null);
  };

  // Handle back from invitation to time input
  const handleBackFromInvitation = () => {
    setState("time_input");
  };

  // Handle choice selection from second question
  const handleChoose = (choice) => {
    setSelectedCategory(choice);
    setState("subquestion");
  };

  // Handle final choice selection from third question
  const handleFinalChoice = (choice) => {
    if (choice === "Watch a film together") {
      setState("film_input");
    } else if (choice === "Send a selfie") {
      setState("selfie");
    } else if (choice === "V 我5.20") {
      setState("payment");
    } else if (choice === "Same playlist same hour") {
      setState("playlist_share");
    } else if (choice === "Plan a date with me") {
      setState("plan_date");
    } else if (choice === "Ask me anything") {
      setState("ask_me_anything");
    } else if (choice === "Compliment roulette") {
      setState("compliment_roulette");
    } else {
      console.log("Final choice:", choice);
      // TODO: Handle the final chosen option
    }
  };

  // Handle back from Ask Me Anything
  const handleBackFromAMQ = () => {
    setState("subquestion");
  };

  // Handle back from playlist share
  const handleBackFromPlaylist = () => {
    setState("subquestion");
  };

  // Handle back from plan date
  const handleBackFromPlanDate = () => {
    setState("subquestion");
  };

  // Handle back from selfie
  const handleBackFromSelfie = () => {
    setState("subquestion");
  };

  // Handle back from compliment roulette
  const handleBackFromComplimentRoulette = () => {
    setState("subquestion");
  };

  // Payment handlers
  const handlePaymentConfirm = () => {
    setPaymentResponse("confirm");
  };

  const handlePaymentReport = () => {
    setPaymentResponse("report");
  };

  const handlePaymentUnsure = () => {
    setPaymentResponse("unsure");
  };

  const handleClosePaymentResponse = () => {
    setPaymentResponse(null);
    setState("subquestion");
  };

  // "我确定了" leads to same success as "确定"
  const handleFinalConfirmFromPhoto = () => {
    handlePaymentConfirm();
  };

  // Handle film confirmation
  const handleFilmConfirm = (filmName) => {
    setSelectedFilm(filmName);
    setState("time_input");
  };

  // Handle time confirmation
  const handleTimeConfirm = (time) => {
    setSelectedTime(time);
    setState("invitation");
  };

  // Handle send button
  const handleSendClick = () => {
    const subject = `Let's watch ${selectedFilm} together!`;
    const body = `Hi Jennifer,\n\nWould you like to watch ${selectedFilm} with me at ${selectedTime}?\n\nBest,\nBowen`;
    const mailtoLink = `mailto:jennifer172624@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    setState("email_sent");
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    setState("selecting");
    setSelectedCard(null);
    setSelectedCategory(null);
    setSelectedFilm(null);
    setSelectedTime(null);
  };

  // Phase 2: Wait 1 second at centered position before flipping
  useEffect(() => {
    if (state === "centered") {
      const timer = setTimeout(() => setState("flipped"), 1000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Handle browser back button
  useEffect(() => {
    const handlePopstate = () => {
      if (state === "selfie") {
        handleBackFromSelfie();
      } else if (state === "ask_me_anything") {
        handleBackFromAMQ();
      } else if (state === "playlist_share") {
        handleBackFromPlaylist();
      } else if (state === "plan_date") {
        handleBackFromPlanDate();
      } else if (state === "film_input") {
        handleBackFromFilmInput();
      } else if (state === "time_input") {
        handleBackFromTimeInput();
      } else if (state === "invitation") {
        handleBackFromInvitation();
      } else if (state === "email_sent") {
        handleBackToDashboard();
      } else if (state === "payment") {
        handleClosePaymentResponse();
      } else if (state === "subquestion") {
        handleBackFromSubquestion();
      } else if (state === "question") {
        handleBackFromQuestion();
      } else if (state === "flipped") {
        handleBack();
      }
    };

    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, [state]);

  // Hover detection
  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    
    // Simple hover detection - check if mouse is over card area
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll(".card-hover-zone");
      let hoveredCardId = null;
      
      cards.forEach((el) => {
        const bounds = el.getBoundingClientRect();
        if (
          e.clientX >= bounds.left &&
          e.clientX <= bounds.right &&
          e.clientY >= bounds.top &&
          e.clientY <= bounds.bottom
        ) {
          hoveredCardId = parseInt(el.dataset.cardId);
        }
      });
      
      setHoveredId(hoveredCardId);
    }
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
  };

  return (
    <div className="flip-page">
      <AnimatePresence mode="wait">
        {state === "selecting" && (
          <motion.div
            key="card-pool"
            className="card-selection-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="card-fan-container">
              {cards.map((card, i) => {
                const numCards = cards.length;
                const maxAngle = 8;
                const horizontalSpacing = 145;
                const angle = (i / (numCards - 1)) * (maxAngle * 2) - maxAngle;
                const xOffset = i * horizontalSpacing - (numCards - 1) * horizontalSpacing / 2;
                const centerIndex = (numCards - 1) / 2;
                const distanceFromCenter = i - centerIndex;
                const curveIntensity = 42;
                const yOffset = Math.pow(distanceFromCenter, 2) * (curveIntensity / Math.pow(centerIndex, 2));

                // Magnified dock effect
                let magnifiedScale = 1;
                if (mousePos.x !== null && mousePos.y !== null) {
                  // Simple distance calculation
                  magnifiedScale = 1;
                }

                return (
                  <motion.div
                    key={card.id}
                    className="card-hover-zone"
                    data-card-id={card.id}
                    initial={{
                      opacity: 1,
                      x: xOffset,
                      y: yOffset,
                      rotate: angle,
                      scale: 0.8,
                    }}
                    animate={{
                      x: xOffset,
                      y: yOffset,
                      rotate: angle,
                      scale: hoveredId === card.id ? 1.1 : 1,
                      opacity: hoveredId === null || hoveredId === card.id ? 1 : 0.4,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                    onClick={() => handleCardClick(card)}
                    style={{
                      position: "fixed",
                      left: "50%",
                      top: "50%",
                      width: "340px",
                      height: "460px",
                      marginLeft: "-170px",
                      marginTop: "-230px",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={card.frontImage}
                      alt="card"
                      className="card-thumbnail"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "18px",
                        filter: "drop-shadow(0 20px 40px rgba(0, 0, 0, 0.2))",
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {state !== "selecting" && selectedCard && state !== "question" && state !== "subquestion" && state !== "film_input" && state !== "time_input" && state !== "invitation" && state !== "email_sent" && state !== "selfie" && state !== "payment" && state !== "playlist_share" && state !== "ask_me_anything" && state !== "plan_date" && state !== "compliment_roulette" && (
          <motion.div
            key="flip-view"
            className="flip-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Back button */}
            <motion.button
              className="back-button"
              onClick={handleBack}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: state === "centered" ? 0.6 : 0 }}
            >
              ‹
            </motion.button>

            {/* Centered flip card - Phase 1: Move to center */}
            <motion.div
              className="centered-card-wrapper"
              initial={{
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
              }}
              onAnimationComplete={() => {
                if (state === "centering") {
                  setState("centered");
                }
              }}
            >
              <CardFlipContainer
                card={selectedCard}
                isSelected={true}
                isFlipped={state === "flipped"}
                onFlipComplete={() => {}}
                onYesClick={handleYes}
              />
            </motion.div>
          </motion.div>
        )}

        {state === "question" && (
          <SecondQuestionScreen
            key="question-view"
            onChoose={handleChoose}
            onBack={handleBackFromQuestion}
          />
        )}

        {state === "subquestion" && selectedCategory && (
          <ThirdQuestionScreen
            key="subquestion-view"
            category={selectedCategory}
            onChoose={handleFinalChoice}
            onBack={handleBackFromSubquestion}
          />
        )}

        {state === "film_input" && (
          <FilmInputScreen
            key="film-input-view"
            onConfirm={handleFilmConfirm}
            onBack={handleBackFromFilmInput}
          />
        )}

        {state === "plan_date" && (
          <PlanDateActivity
            key="plan-date-view"
            onBack={handleBackFromPlanDate}
          />
        )}

        {state === "time_input" && (
          <TimeInputScreen
            key="time-input-view"
            filmName={selectedFilm}
            onConfirm={handleTimeConfirm}
            onBack={handleBackFromTimeInput}
          />
        )}

        {state === "invitation" && (
          <InvitationScreen
            key="invitation-view"
            filmName={selectedFilm}
            time={selectedTime}
            onSendClick={handleSendClick}
            onBack={handleBackFromInvitation}
          />
        )}

        {state === "email_sent" && (
          <EmailSentScreen
            key="email-sent-view"
            onBackToDashboard={handleBackToDashboard}
          />
        )}

        {state === "selfie" && (
          <SelfieScreen
            key="selfie-view"
            onBack={handleBackFromSelfie}
            onCapture={() => {}}
          />
        )}

        {state === "payment" && !paymentResponse && (
          <PaymentWarningScreen
            key="payment-warning-view"
            onConfirm={handlePaymentConfirm}
            onReport={handlePaymentReport}
            onUnsure={handlePaymentUnsure}
          />
        )}

        {state === "payment" && paymentResponse && (
          <PaymentResponseScreen
            key="payment-response-view"
            type={paymentResponse}
            onClose={handleClosePaymentResponse}
            onFinalConfirm={handleFinalConfirmFromPhoto}
          />
        )}

        {state === "playlist_share" && (
          <PlaylistShareScreen
            key="playlist-share-view"
            onBack={handleBackFromPlaylist}
          />
        )}

        {state === "ask_me_anything" && (
          <AskMeAnythingScreen
            key="ask-me-anything-view"
            onBack={handleBackFromAMQ}
          />
        )}

        {state === "compliment_roulette" && (
          <ComplimentRoulette
            key="compliment-roulette-view"
            onBack={handleBackFromComplimentRoulette}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
