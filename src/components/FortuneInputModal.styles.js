// src/components/FortuneInputModal.styles.js

import styled from 'styled-components';

export const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
`;

export const Container = styled.div`
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    width: 90%;
    max-width: 500px;
    max-height: 85vh;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const Header = styled.div`
    padding: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
    position: relative;
`;

export const Title = styled.h2`
    margin: 0;
    font-size: 24px;
    font-weight: 700;
`;

export const Subtitle = styled.p`
    margin: 8px 0 0 0;
    font-size: 14px;
    opacity: 0.9;
`;

export const CloseButton = styled.button`
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 24px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`;

export const Content = styled.div`
    padding: 24px;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const InputSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const Label = styled.label`
    font-size: 16px;
    font-weight: 600;
    color: #e0e0e0;
`;

export const Input = styled.input`
    padding: 12px 16px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    font-size: 16px;
    transition: border-color 0.2s;
    background: #333842;
    color: #e0e0e0;

    &:focus {
        outline: none;
        border-color: #667eea;
        background: #3a3f4a;
    }

    &::placeholder {
        color: #999999;
    }
`;

export const Select = styled.select`
    padding: 12px 16px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    font-size: 16px;
    background: #333842;
    color: #e0e0e0;
    cursor: pointer;
    transition: border-color 0.2s;

    &:focus {
        outline: none;
        border-color: #667eea;
        background: #3a3f4a;
    }

    option {
        background: #333842;
        color: #e0e0e0;
    }
`;

export const RadioGroup = styled.div`
    display: flex;
    gap: 16px;
    margin-top: 8px;
`;

export const RadioLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 16px;
    color: #d0d0d0;
    transition: color 0.2s;

    &:hover {
        color: #667eea;
    }

    input[type="radio"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #667eea;
    }
`;

export const CheckboxLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #555;

    input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: #667eea;
    }
`;

export const TimeInputGroup = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
`;

export const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

export const Button = styled.button`
    flex: 1;
    padding: 14px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
    ` : `
        background: #e2e8f0;
        color: #666;
        &:hover {
            background: #cbd5e0;
        }
    `}

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        &:hover {
            transform: none;
            box-shadow: none;
        }
    }
`;

export const InfoText = styled.p`
    font-size: 12px;
    color: #b0b0b0;
    margin: 4px 0 0 0;
    line-height: 1.4;
`;

export const LunarDateDisplay = styled.div`
    font-size: 13px;
    color: #667eea;
    font-weight: 600;
    margin-top: 4px;
    padding: 4px 8px;
    background: transparent;
    border-radius: 4px;
    min-height: 21px; /* 공간 미리 확보 */
    display: flex;
    align-items: center;
`;

export const LunarConvertButton = styled.button`
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #667eea;
    background: white;
    border: 1.5px solid #667eea;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        background: #667eea;
        color: white;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

export const LunarContainer = styled.div`
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 60px;
    padding-right: 40px;
    max-width: 100%;

    /* 모바일 세로 모드 (기본) */
    @media (max-width: 767px) {
        padding-left: 50px;
        padding-right: 30px;
    }

    /* 모바일 가로 모드 및 태블릿 */
    @media (min-width: 768px) {
        padding-left: 70px;
        padding-right: 52px;
    }

    /* 데스크탑 */
    @media (min-width: 1024px) {
        padding-left: 80px;
        padding-right: 60px;
    }

    /* 대형 데스크탑 */
    @media (min-width: 1440px) {
        padding-left: 90px;
        padding-right: 70px;
    }

    /* 초대형 화면 */
    @media (min-width: 1900px) {
        padding-left: 100px;
        padding-right: 80px;
    }
`;

export const UserNameDisplay = styled.div`
    padding: 12px 16px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    font-size: 16px;
    background: rgba(255, 255, 255, 0.05);
    color: #d0d0d0;
`;

// 도시 검색 모달 오버레이
export const CitySearchModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
`;

// 도시 검색 모달 컨테이너
export const CitySearchModalContainer = styled.div`
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    width: 90%;
    max-width: 500px;
    max-height: 70vh;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

// 도시 검색 모달 헤더
export const CitySearchModalHeader = styled.div`
    padding: 20px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const CitySearchModalTitle = styled.h3`
    margin: 0;
    font-size: 20px;
    font-weight: 700;
`;

// 도시 검색 모달 바디
export const CitySearchModalBody = styled.div`
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    overflow: hidden;
`;

// 도시 검색 인풋
export const CitySearchInput = styled.input`
    padding: 14px 16px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    font-size: 16px;
    transition: border-color 0.2s;
    background: #333842;
    color: #e0e0e0;

    &:focus {
        outline: none;
        border-color: #667eea;
        background: #3a3f4a;
    }

    &::placeholder {
        color: #808080;
    }
`;

// 도시 검색 결과 리스트
export const CitySearchResultsList = styled.div`
    flex: 1;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    padding: 8px;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(240, 147, 251, 0.3);
        border-radius: 4px;
    }
`;

// 도시 검색 헬퍼 텍스트
export const CitySearchHelperText = styled.div`
    padding: 16px;
    text-align: center;
    color: #b0b0b0;
    font-size: 14px;
    line-height: 1.6;
`;

export const CitySearchItem = styled.div`
    padding: 14px 16px;
    cursor: pointer;
    transition: background 0.2s;
    border-radius: 8px;
    margin-bottom: 4px;
    background: rgba(255, 255, 255, 0.05);

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    &:active {
        background: rgba(255, 255, 255, 0.08);
    }
`;

export const CitySearchItemPrimary = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #e0e0e0;
    margin-bottom: 4px;
`;

export const CitySearchItemSecondary = styled.div`
    font-size: 13px;
    color: #b0b0b0;
    line-height: 1.4;
`;

export const CitySearchLoading = styled.div`
    padding: 32px 16px;
    text-align: center;
    color: #b0b0b0;
    font-size: 14px;
`;

export const CitySearchEmpty = styled.div`
    padding: 32px 16px;
    text-align: center;
    color: #b0b0b0;
    font-size: 14px;
`;

export const ConfirmSection = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const ConfirmTitle = styled.h3`
    margin: 0 0 16px 0;
    font-size: 18px;
    color: #667eea;
`;

export const ConfirmItem = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:last-child {
        border-bottom: none;
    }
`;

export const ConfirmLabel = styled.span`
    color: #b0b0b0;
    font-size: 14px;
`;

export const ConfirmValue = styled.span`
    color: #e0e0e0;
    font-size: 14px;
    font-weight: 600;
`;

// 음력 경고 모달
export const WarningOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 20000;
`;

export const WarningBox = styled.div`
    background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
    border-radius: 16px;
    padding: 32px 24px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const WarningIcon = styled.div`
    font-size: 48px;
    margin-bottom: 16px;
`;

export const WarningTitle = styled.h3`
    font-size: 20px;
    font-weight: 700;
    color: #e0e0e0;
    margin: 0 0 12px 0;
`;

export const WarningMessage = styled.p`
    font-size: 15px;
    color: #b0b0b0;
    line-height: 1.6;
    margin: 0 0 24px 0;
    white-space: pre-line;
`;

export const WarningButtonGroup = styled.div`
    display: flex;
    gap: 12px;
`;

export const WarningButton = styled.button`
    flex: 1;
    padding: 14px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
    ` : `
        background: #f0f2f5;
        color: #666;

        &:hover {
            background: #e1e4e8;
        }
    `}
`;
