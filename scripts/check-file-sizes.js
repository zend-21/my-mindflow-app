#!/usr/bin/env node

/**
 * 파일 크기 체크 스크립트
 * 모듈화 규칙에 따라 파일 크기를 검증합니다.
 *
 * Usage: node scripts/check-file-sizes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIMITS = {
  RECOMMENDED: 500,
  WARNING: 1000,
  CRITICAL: 1500
};

const COLORS = {
  RESET: '\x1b[0m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
  CYAN: '\x1b[36m',
  BOLD: '\x1b[1m'
};

// 제외할 디렉토리
const EXCLUDE_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage'
];

// 검사할 파일 확장자
const TARGET_EXTENSIONS = ['.jsx', '.js', '.tsx', '.ts'];

/**
 * 파일의 줄 수를 계산
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * 디렉토리를 재귀적으로 탐색
 */
function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        walkDir(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (TARGET_EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * 파일 크기 상태 결정
 */
function getStatus(lines) {
  if (lines <= LIMITS.RECOMMENDED) {
    return { level: 'GOOD', color: COLORS.GREEN, symbol: '✅' };
  } else if (lines <= LIMITS.WARNING) {
    return { level: 'WARNING', color: COLORS.YELLOW, symbol: '⚠️' };
  } else if (lines <= LIMITS.CRITICAL) {
    return { level: 'CRITICAL', color: COLORS.RED, symbol: '🔴' };
  } else {
    return { level: 'SEVERE', color: COLORS.RED, symbol: '🚨' };
  }
}

/**
 * 메인 함수
 */
function main() {
  const srcDir = path.join(__dirname, '..', 'src');

  console.log(`${COLORS.CYAN}${COLORS.BOLD}`);
  console.log('═══════════════════════════════════════════');
  console.log('  📏 파일 크기 검사 (Modularization Check)');
  console.log('═══════════════════════════════════════════');
  console.log(COLORS.RESET);
  console.log(`${COLORS.CYAN}검사 디렉토리: ${srcDir}${COLORS.RESET}\n`);

  const files = walkDir(srcDir);
  const results = [];

  let goodCount = 0;
  let warningCount = 0;
  let criticalCount = 0;
  let severeCount = 0;

  files.forEach(filePath => {
    const lines = countLines(filePath);
    const relativePath = path.relative(process.cwd(), filePath);
    const status = getStatus(lines);

    results.push({
      path: relativePath,
      lines,
      status
    });

    if (status.level === 'GOOD') goodCount++;
    else if (status.level === 'WARNING') warningCount++;
    else if (status.level === 'CRITICAL') criticalCount++;
    else severeCount++;
  });

  // 문제 있는 파일만 표시 (경고 이상)
  const problematicFiles = results.filter(r => r.status.level !== 'GOOD');

  if (problematicFiles.length > 0) {
    console.log(`${COLORS.YELLOW}${COLORS.BOLD}⚠️  리팩토링이 필요한 파일:${COLORS.RESET}\n`);

    problematicFiles
      .sort((a, b) => b.lines - a.lines)
      .forEach(({ path: filePath, lines, status }) => {
        console.log(`${status.color}${status.symbol} ${filePath}${COLORS.RESET}`);
        console.log(`   ${lines} 줄 (제한: ${LIMITS.RECOMMENDED}줄)\n`);
      });
  }

  // 통계 요약
  console.log(`${COLORS.CYAN}${COLORS.BOLD}═══════════════════════════════════════════${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}📊 통계 요약${COLORS.RESET}\n`);
  console.log(`전체 파일: ${files.length}개`);
  console.log(`${COLORS.GREEN}✅ 양호 (≤${LIMITS.RECOMMENDED}줄): ${goodCount}개${COLORS.RESET}`);
  console.log(`${COLORS.YELLOW}⚠️  주의 (${LIMITS.RECOMMENDED}-${LIMITS.WARNING}줄): ${warningCount}개${COLORS.RESET}`);
  console.log(`${COLORS.RED}🔴 심각 (${LIMITS.WARNING}-${LIMITS.CRITICAL}줄): ${criticalCount}개${COLORS.RESET}`);
  console.log(`${COLORS.RED}🚨 매우심각 (>${LIMITS.CRITICAL}줄): ${severeCount}개${COLORS.RESET}\n`);

  // Top 10 큰 파일
  const top10 = results
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 10);

  console.log(`${COLORS.CYAN}${COLORS.BOLD}📈 가장 큰 파일 Top 10${COLORS.RESET}\n`);
  top10.forEach(({ path: filePath, lines, status }, index) => {
    console.log(`${index + 1}. ${status.color}${filePath}${COLORS.RESET} - ${lines} 줄`);
  });

  console.log('\n');

  // 종료 코드 결정
  if (severeCount > 0 || criticalCount > 0) {
    console.log(`${COLORS.RED}${COLORS.BOLD}❌ 검사 실패: 즉시 리팩토링이 필요한 파일이 있습니다!${COLORS.RESET}\n`);
    console.log(`${COLORS.YELLOW}📖 가이드: .claude-code/MODULARIZATION_RULES.md 참조${COLORS.RESET}\n`);
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`${COLORS.YELLOW}${COLORS.BOLD}⚠️  경고: 리팩토링 검토가 필요한 파일이 있습니다.${COLORS.RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${COLORS.GREEN}${COLORS.BOLD}✅ 모든 파일이 권장 크기 이내입니다!${COLORS.RESET}\n`);
    process.exit(0);
  }
}

// 스크립트 실행
main();
