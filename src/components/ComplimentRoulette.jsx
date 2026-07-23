import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ComplimentRoulette.css';

const compliments = [
  "宝宝对我笑的时候世界都化掉了",
  "宝宝永远不会故意让我受伤",
  "宝宝会因为一些小小细节而开心雀跃的样子是我最爱宝宝的地方之一",
  "宝宝是一个小绅士",
  "宝宝看待我的方式让我成为了更好的自己",
  "宝宝是一只聪明宝宝！",
  "宝宝比自己想象中更懂得爱人，只是你自己还没有意识到",
  "我对宝宝的信任早已超过了我曾经信任过的任何人",
  "异地恋的时候，距离并没有让宝宝离我更远，反而让我更加相信我们共同的未来",
];

// 生成一轮消息：9个compliment随机顺序 + Your Turn插入在第4位之后
const generateRound = () => {
  // 随机打乱compliments
  const shuffled = [...compliments].sort(() => Math.random() - 0.5);

  // Your Turn出现在第4位到第10位之间的随机位置（索引3到9）
  const yourTurnPosition = Math.floor(Math.random() * 7) + 3; // 3-9

  // 构建这一轮的消息数组
  const round = shuffled.map(text => ({
    type: 'compliment',
    text
  }));

  // 在指定位置插入Your Turn
  round.splice(yourTurnPosition, 0, {
    type: 'your-turn',
    text: 'your-turn'
  });

  return round;
};

function ComplimentRoulette({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [herCompliment, setHerCompliment] = useState('');
  const [finalResult, setFinalResult] = useState(null);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    // 页面加载时生成第一轮消息
    const firstRound = generateRound();
    setMessages(firstRound);
    displayMessage(0, firstRound);
  }, []);

  const displayMessage = (index, msgs) => {
    if (index < msgs.length) {
      const msg = msgs[index];
      if (msg.type === 'compliment') {
        setFinalResult(msg.text);
        setShowInput(false);
      } else if (msg.type === 'your-turn') {
        setShowInput(true);
        setFinalResult(null);
      }
    }
  };

  const submitCompliment = () => {
    setFinalResult(herCompliment);
    setShowInput(false);
  };

  const handleAgain = () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex < messages.length) {
      // 继续显示下一个消息
      setCurrentIndex(nextIndex);
      displayMessage(nextIndex, messages);
      setHerCompliment('');
    } else {
      // 这一轮结束，生成新一轮
      const newRound = generateRound();
      setMessages(newRound);
      setCurrentIndex(0);
      displayMessage(0, newRound);
      setFinalResult(null);
      setHerCompliment('');
    }
  };

  return (
    <div className="compliment-screen">
      <button className="back-arrow-button" onClick={onBack}>
        ‹
      </button>

      <AnimatePresence mode="wait">
        {finalResult && !showInput && (
          <motion.div
            key="compliment"
            className="compliment-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p>{finalResult}</p>
            <motion.button
              className="again-btn"
              onClick={handleAgain}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Again
            </motion.button>
          </motion.div>
        )}

        {showInput && (
          <motion.div
            key="input"
            className="input-box"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="input-prompt">Now it's your turn 💕</p>
            <div className="lined-input-wrapper">
              <input
                type="text"
                className="lined-input"
                value={herCompliment}
                onChange={(e) => setHerCompliment(e.target.value)}
                placeholder="Write something..."
                autoFocus
              />
            </div>
            <motion.button
              className="submit-btn"
              onClick={submitCompliment}
              disabled={!herCompliment.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Submit
            </motion.button>
            {herCompliment.trim() && (
              <motion.button
                className="again-btn"
                onClick={handleAgain}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ marginTop: '15px' }}
              >
                Again
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ComplimentRoulette;
