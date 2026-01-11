# Share Note - React Application

A collaborative note-taking and messaging application built with React and Firebase.

---

## 🏗️ 코드 작성 규칙 (CRITICAL - 항상 준수!)

> **⚠️ 모든 코드 작업 전 필독**: [모듈화 규칙 문서](./.claude-code/MODULARIZATION_RULES.md)

### 핵심 규칙 요약

```
🚨 파일 크기 제한:
- 권장: 300-500줄
- 경고: 500-1000줄 (리팩토링 검토)
- 금지: 1000줄 이상 (즉시 모듈화 필수)

✅ Styled Components:
- 10개 이상 시 `.styles.js` 파일로 분리 필수
- import * as S from './Component.styles';

✅ 유틸리티 함수:
- 재사용 가능한 함수는 utils/ 폴더로 분리

✅ 모달/큰 컴포넌트:
- 100줄 이상 시 별도 파일로 분리
```

**상세 내용**: `.claude-code/MODULARIZATION_RULES.md` 참조

---

## 📊 현재 모듈화 상태 (2026-01-12)

| 파일 | 줄 수 | 분리된 모듈 | 상태 |
|------|-------|------------|------|
| CollaborativeDocumentEditor.jsx | 5,248 | styles, rangeUtils | ✅ |
| ChatRoom.jsx | 2,973 | styles | ✅ |
| App.jsx | 3,087 | styles | ✅ |

---

## Tech Stack

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
