// Range 관련 유틸리티 함수들
// DOM 선택 영역(Range)과 절대 오프셋 간 변환을 처리

/**
 * 컨테이너 기준으로 노드의 절대 오프셋 계산
 * @param {HTMLElement} container - 기준 컨테이너
 * @param {Node} node - 대상 노드
 * @param {number} offset - 노드 내 오프셋
 * @returns {number} 절대 오프셋
 */
export function getAbsoluteOffset(container, node, offset) {
  let absoluteOffset = 0;
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let currentNode;
  while ((currentNode = walker.nextNode())) {
    if (currentNode === node) {
      return absoluteOffset + offset;
    }
    absoluteOffset += currentNode.nodeValue.length;
  }

  return absoluteOffset;
}

/**
 * 절대 오프셋에서 노드와 오프셋 찾기
 * @param {HTMLElement} container - 기준 컨테이너
 * @param {number} absoluteOffset - 절대 오프셋
 * @returns {{node: Node, offset: number}|null} 노드와 오프셋 객체
 */
export function getNodeAndOffset(container, absoluteOffset) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let currentOffset = 0;
  let currentNode;

  while ((currentNode = walker.nextNode())) {
    const nodeLength = currentNode.nodeValue.length;
    console.log('🔍 노드 탐색:', {
      nodeText: currentNode.nodeValue.substring(0, 30),
      nodeLength,
      currentOffset,
      targetOffset: absoluteOffset,
      rangeEnd: currentOffset + nodeLength
    });
    if (currentOffset + nodeLength > absoluteOffset) {
      console.log('✅ 노드 찾음:', {
        node: currentNode,
        nodeText: currentNode.nodeValue,
        offset: absoluteOffset - currentOffset
      });
      return {
        node: currentNode,
        offset: absoluteOffset - currentOffset
      };
    }
    currentOffset += nodeLength;
  }

  return null;
}

/**
 * Range를 절대 오프셋으로 변환
 * @param {Range} range - DOM Range 객체
 * @param {HTMLElement} container - 기준 컨테이너
 * @returns {{startOffset: number, endOffset: number}} 시작/끝 절대 오프셋
 */
export function rangeToAbsoluteOffset(range, container) {
  const startOffset = getAbsoluteOffset(container, range.startContainer, range.startOffset);
  const endOffset = getAbsoluteOffset(container, range.endContainer, range.endOffset);
  return { startOffset, endOffset };
}

/**
 * 절대 오프셋을 Range로 복원
 * @param {HTMLElement} container - 기준 컨테이너
 * @param {number} startOffset - 시작 절대 오프셋
 * @param {number} endOffset - 끝 절대 오프셋
 * @returns {Range} 복원된 Range 객체
 */
export function absoluteOffsetToRange(container, startOffset, endOffset) {
  const range = document.createRange();
  const startPoint = getNodeAndOffset(container, startOffset);
  const endPoint = getNodeAndOffset(container, endOffset);

  if (startPoint && endPoint) {
    range.setStart(startPoint.node, startPoint.offset);
    range.setEnd(endPoint.node, endPoint.offset);
  }

  return range;
}
