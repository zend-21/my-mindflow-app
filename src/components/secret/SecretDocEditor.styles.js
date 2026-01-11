// src/components/secret/SecretDocEditor.styles.js
// Styled Components for SecretDocEditor

import styled from 'styled-components';

export const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    touch-action: none;
    overscroll-behavior: contain;
`;

export const Modal = styled.div`
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border-radius: 16px;
    width: 90vw;
    max-width: 600px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const Header = styled.div`
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const Title = styled.h2`
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

export const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 28px;
    color: #ffffff;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        opacity: 1;
    }
`;

export const Body = styled.div`
    padding: 24px;
    overflow-y: auto;
    flex: 1;

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

export const FormGroup = styled.div`
    margin-bottom: 20px;
`;

export const Label = styled.label`
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #d0d0d0;
    margin-bottom: 8px;
`;

export const LabelRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

export const ImportanceCheckbox = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ff6b6b;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #ff6b6b;
    }
`;

export const Input = styled.input`
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 14px;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: rgba(240, 147, 251, 0.5);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
    }

    &::placeholder {
        color: #808080;
    }
`;

export const ContentEditor = styled.div`
    width: 100%;
    min-height: 200px;
    max-height: 400px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s;
    overflow-y: auto;
    white-space: pre-wrap;
    word-wrap: break-word;

    &:focus {
        outline: none;
        border-color: rgba(240, 147, 251, 0.5);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
    }

    /* HTML 서식 지원 - 기본 스타일 */
    h1, h2, h3, h4, h5, h6 {
        margin: 0.8em 0 0.4em 0;
        color: #ffffff;
    }

    p {
        margin: 0.5em 0;
    }

    ul, ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
    }

    li {
        margin: 0.3em 0;
    }

    a {
        color: #4a90e2;
        text-decoration: underline;
    }

    blockquote {
        border-left: 3px solid rgba(74, 144, 226, 0.5);
        padding-left: 1em;
        margin: 1em 0;
        color: #b0b0b0;
    }

    code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 0.9em;
    }

    pre {
        background: rgba(0, 0, 0, 0.3);
        padding: 1em;
        border-radius: 8px;
        overflow-x: auto;
        margin: 1em 0;
    }

    pre code {
        background: none;
        padding: 0;
    }

    img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 0.5em 0;
    }

    iframe {
        width: 100%;
        max-width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;
        border-radius: 8px;
        margin: 1em 0;
    }

    table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
    }

    th, td {
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px;
        text-align: left;
    }

    th {
        background: rgba(255, 255, 255, 0.1);
        font-weight: 600;
    }

    strong, b {
        font-weight: 600;
        color: #ffffff;
    }

    em, i {
        font-style: italic;
    }

    /* 스크롤바 스타일링 */
    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(240, 147, 251, 0.4);
        border-radius: 4px;

        &:hover {
            background: rgba(240, 147, 251, 0.6);
        }
    }

    /* 빈 상태 플레이스홀더 */
    &[data-placeholder]:empty:before {
        content: attr(data-placeholder);
        color: #808080;
        pointer-events: none;
    }
`;

export const Select = styled.select`
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: rgba(240, 147, 251, 0.5);
        box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
    }

    option {
        background: #1a1d24;
        color: #ffffff;
    }
`;

export const TagsInput = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    min-height: 44px;
`;

export const Tag = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(240, 147, 251, 0.2);
    border: 1px solid rgba(240, 147, 251, 0.3);
    color: #ffffff;
    font-size: 13px;
`;

export const RemoveTagButton = styled.button`
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }
`;

export const TagInput = styled.input`
    flex: 1;
    min-width: 100px;
    padding: 4px;
    border: none;
    background: transparent;
    color: #ffffff;
    font-size: 13px;

    &:focus {
        outline: none;
    }

    &::placeholder {
        color: #808080;
    }
`;

export const CheckboxGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const Checkbox = styled.input`
    width: 18px;
    height: 18px;
    cursor: pointer;
`;

export const ErrorText = styled.div`
    color: #ff6b6b;
    font-size: 13px;
    margin-top: 6px;
    font-weight: 500;
`;

export const PasswordInputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
`;

export const PasswordInput = styled(Input)`
    flex: 1;
    margin-top: 0 !important;
`;

export const ShowPasswordButton = styled.button`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #d0d0d0;
    font-size: 20px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
    }
`;

export const CategoryButtons = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    width: 100%;
`;

export const CategoryButton = styled.button`
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid ${props => {
        if (!props.$active) return 'rgba(255, 255, 255, 0.1)';
        switch(props.$category) {
            case 'financial': return 'rgba(255, 215, 0, 0.5)';
            case 'personal': return 'rgba(167, 139, 250, 0.5)';
            case 'work': return 'rgba(96, 165, 250, 0.5)';
            case 'diary': return 'rgba(244, 114, 182, 0.5)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }};
    background: ${props => {
        if (!props.$active) return 'rgba(255, 255, 255, 0.05)';
        switch(props.$category) {
            case 'financial': return 'rgba(255, 215, 0, 0.2)';
            case 'personal': return 'rgba(167, 139, 250, 0.2)';
            case 'work': return 'rgba(96, 165, 250, 0.2)';
            case 'diary': return 'rgba(244, 114, 182, 0.2)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
    color: ${props => {
        if (!props.$active) return '#d0d0d0';
        switch(props.$category) {
            case 'financial': return '#FFD700';
            case 'personal': return '#A78BFA';
            case 'work': return '#60A5FA';
            case 'diary': return '#F472B6';
            default: return '#ffffff';
        }
    }};
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    &:hover {
        background: ${props => {
            if (!props.$active) return 'rgba(255, 255, 255, 0.08)';
            switch(props.$category) {
                case 'financial': return 'rgba(255, 215, 0, 0.3)';
                case 'personal': return 'rgba(167, 139, 250, 0.3)';
                case 'work': return 'rgba(96, 165, 250, 0.3)';
                case 'diary': return 'rgba(244, 114, 182, 0.3)';
                default: return 'rgba(255, 255, 255, 0.08)';
            }
        }};
        border-color: ${props => {
            if (!props.$active) return 'rgba(255, 255, 255, 0.2)';
            switch(props.$category) {
                case 'financial': return 'rgba(255, 215, 0, 0.6)';
                case 'personal': return 'rgba(167, 139, 250, 0.6)';
                case 'work': return 'rgba(96, 165, 250, 0.6)';
                case 'diary': return 'rgba(244, 114, 182, 0.6)';
                default: return 'rgba(255, 255, 255, 0.2)';
            }
        }};
    }
`;

export const Footer = styled.div`
    padding: 20px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
`;

export const Button = styled.button`
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;

    ${props => props.$primary ? `
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3));
        color: white;
        border: 1px solid rgba(240, 147, 251, 0.5);
        box-shadow: 0 2px 8px rgba(240, 147, 251, 0.2);

        &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4);
            background: linear-gradient(135deg, rgba(240, 147, 251, 0.4), rgba(245, 87, 108, 0.4));
        }
    ` : `
        background: rgba(255, 255, 255, 0.05);
        color: #d0d0d0;
        border: 1px solid rgba(255, 255, 255, 0.1);

        &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
        }
    `}

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.03);
        color: #606060;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: none;
    }
`;

export const ErrorModal = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, #1a1d24 0%, #2a2d35 100%);
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: 12px;
    padding: 24px;
    z-index: 10001;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    min-width: 280px;
    max-width: 90vw;
`;

export const ErrorModalTitle = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #ff6b6b;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const ErrorModalMessage = styled.div`
    font-size: 14px;
    color: #d0d0d0;
    margin-bottom: 20px;
    line-height: 1.5;
`;

export const ErrorModalButton = styled.button`
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3));
    color: white;
    border: 1px solid rgba(240, 147, 251, 0.5);

    &:hover {
        background: linear-gradient(135deg, rgba(240, 147, 251, 0.4), rgba(245, 87, 108, 0.4));
    }

    &:active {
        transform: translateY(0);
    }
`;
