// src/components/Roulette.jsx

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import Confetti from 'react-confetti';
import Portal from './Portal';

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

// ★★★ 반투명 오버레이와 룰렛을 감싸는 컨테이너 ★★★
// 배경은 투명하게 유지하되, 룰렛 주변에만 반투명한 효과를 남깁니다.
const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: ${fadeIn} 0.3s ease-out;
`;

// ★★★ 룰렛판과 운세를 표시할 원형 영역 ★★★
const RouletteWheel = styled.div`
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background-color: transparent; /* 배경색 제거 */
    position: relative;
    overflow: hidden;
    transition: transform 3s cubic-bezier(0.2, 0, 0, 1); /* 부드러운 회전 효과 */
    border: 5px solid white; /* 룰렛판 가장자리 테두리 */
`;

// ★★★ 룰렛의 각 조각(Slice) 스타일 ★★★
// 각 조각이 원을 채우도록 CSS conic-gradient를 사용하거나, transform: rotate를 사용합니다.
const RouletteSlice = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: 50% 50%;
    text-align: center;
    color: white;
    font-weight: bold;
    font-size: 14px;
    
    // 각 조각을 원형으로 배치하기 위한 CSS
    clip-path: polygon(50% 50%, 50% 0%, 95% 10%, 97% 50%, 95% 90%, 50% 100%);
    
    background-color: ${props => props.color};
    transform: rotate(${props => props.rotation}deg);
`;

const SliceText = styled.div`
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%) rotate(${props => props.textRotation}deg);
    white-space: nowrap;
    width: 100px;
    text-align: center;
    color: ${props => props.isBlack ? 'black' : 'white'};
`;

// ★★★ 룰렛이 멈출 위치를 가리키는 포인터 ★★★
const Pointer = styled.div`
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 20px 15px 0 15px;
    border-color: #ff3838 transparent transparent transparent;
    z-index: 10;
`;

// ★★★ 결과 메시지를 보여줄 컨테이너 ★★★
const ResultBox = styled.div`
    position: absolute;
    bottom: -120px;
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    padding: 10px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    animation: ${fadeIn} 0.5s ease-out;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    font-weight: 600;
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const spinButton = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const luckyWords = [
    "최고의 운세!", // 폭죽 효과가 터질 운세
    "기분 좋은 하루",
    "곧 행운이 찾아옵니다",
    "오늘 운세는 보통",
    "생각한대로 이루어져요",
    "오늘은 모든 일이 잘 풀릴 거예요",
    "밝은 미소는 행운을 부릅니다",
];

const sliceColors = ['#ffc83c', '#ff8e6a', '#4dc0a6', '#6a97ff', '#ff8383', '#5a5477', '#f8569c'];

const Roulette = ({ onClose }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState(null);
    const [isJackpot, setIsJackpot] = useState(false);
    const [wheelRotation, setWheelRotation] = useState(0);

    const spinRoulette = () => {
        setIsSpinning(true);
        setIsJackpot(false);
        setResult(null);

        const numSlices = luckyWords.length;
        const sliceDegree = 360 / numSlices;
        
        // 무작위로 당첨 인덱스 선택
        const winningIndex = Math.floor(Math.random() * numSlices);

        // 가장 좋은 운세 당첨 여부 확인
        if (luckyWords[winningIndex] === "최고의 운세!") {
            setIsJackpot(true);
        }

        // 룰렛 회전 각도 계산
        // 3~5바퀴 정도는 돌게 만들고, 마지막에 당첨 섹션으로 멈추도록 계산
        const spinRounds = 3 + Math.floor(Math.random() * 3);
        const randomOffset = Math.random() * sliceDegree * 0.8; // 섹션 내에서 무작위 위치
        const finalAngle = spinRounds * 360 + (360 - winningIndex * sliceDegree) + (sliceDegree / 2) + randomOffset;
        setWheelRotation(finalAngle);

        setTimeout(() => {
            setIsSpinning(false);
            setResult(luckyWords[winningIndex]);
        }, 3100); // 3.1초 후 결과 표시
    };

    const handleOverlayClick = (e) => {
      // 룰렛을 돌리는 중이 아닐 때만 닫기
      if (!isSpinning) {
        onClose();
      }
    };

    return (
      <Portal>
        <Overlay onClick={handleOverlayClick}>
            {isJackpot && <Confetti width={window.innerWidth} height={window.innerHeight} />}
            <div onClick={e => e.stopPropagation()} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.4)', marginBottom: '30px' }}>오늘의 행운 메시지</h2>
                <Pointer />
                <RouletteWheel style={{ transform: `rotate(${wheelRotation}deg)` }}>
                    {luckyWords.map((word, index) => {
                        const numSlices = luckyWords.length;
                        const sliceDegree = 360 / numSlices;
                        const rotation = index * sliceDegree;
                        const isBlack = (index % 2) === 0;

                        return (
                            <div key={index} style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                transformOrigin: '50% 50%',
                                overflow: 'hidden',
                                transform: `rotate(${rotation}deg)`
                            }}>
                                <div style={{
                                    width: '200%',
                                    height: '200%',
                                    transform: `translate(-25%, -25%) rotate(45deg)`, // 회전 보정
                                    backgroundColor: sliceColors[index % sliceColors.length],
                                    clipPath: `polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 0)`
                                }} />
                                <SliceText textRotation={sliceDegree / 2} isBlack={isBlack}>{word}</SliceText>
                            </div>
                        );
                    })}
                </RouletteWheel>
                <button
                    onClick={spinRoulette}
                    disabled={isSpinning}
                    style={{
                        marginTop: '30px',
                        padding: '12px 30px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        borderRadius: '30px',
                        border: 'none',
                        backgroundColor: '#ff4d4f',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s ease',
                    }}
                >
                    {isSpinning ? "돌리는 중..." : "룰렛 돌리기"}
                </button>
                {result && <ResultBox>{result}</ResultBox>}
            </div>
        </Overlay>
      </Portal>
    );
};

export default Roulette;