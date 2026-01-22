// src/components/QuickActions.jsx

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import {
    DndContext,
    closestCenter,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ActionsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
    position: relative;
`;

const ActionCard = styled.div`
    background: linear-gradient(135deg, #2a2d35, #333842);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: grab;
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1),
                box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1),
                background-color 0.2s ease;
    display: flex;
    align-items: center;
    user-select: none;
    transform-origin: center;

    &:active {
        cursor: grabbing;
    }

    &:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    }

    ${props => props.$isDragging && `
        transform: rotate(5deg) scale(1.05);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        background: linear-gradient(135deg, #333842, #3d4451);
        z-index: 1000;
        opacity: 0.9;
    `}

    ${props => props.$isOver && `
        background: rgba(240, 147, 251, 0.15);
        border-color: rgba(240, 147, 251, 0.3);
        transform: scale(0.98);
    `}
`;

const CardIcon = styled.div`
    font-size: 32px;
    margin-right: 12px;
    transition: transform 0.2s ease;

    ${props => props.$isDragging && `
        transform: scale(1.1);
    `}
`;

const CardContent = styled.div`
    flex: 1;
`;

const CardTitle = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #e0e0e0;
    transition: color 0.2s ease;
`;

const CardSubtitle = styled.div`
    font-size: 12px;
    color: #b0b0b0;
    margin-top: 2px;
    transition: color 0.2s ease;
`;

const DragOverlayCard = ({ item }) => (
    <ActionCard $isDragging>
        <div style={{
            transform: 'rotate(5deg) scale(1.05)',
            transformOrigin: 'center'
        }}>
            <CardIcon $isDragging>{item.icon}</CardIcon>
            <CardContent>
                <CardTitle>{item.title}</CardTitle>
                <CardSubtitle>{item.subtitle}</CardSubtitle>
            </CardContent>
        </div>
    </ActionCard>
);

const SortableItem = ({ item, onSwitchTab, isDragOverlay = false }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({
        id: item.id,
        transition: {
            duration: 200,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        zIndex: isDragging ? 1000 : 1,
    };

    return (
        <ActionCard
            ref={setNodeRef}
            style={style}
            $isDragging={isDragging}
            $isOver={isOver}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                if (!isDragging) {
                    onSwitchTab(item.id);
                }
            }}
        >
            <CardIcon $isDragging={isDragging}>{item.icon}</CardIcon>
            <CardContent>
                <CardTitle>{item.title}</CardTitle>
                <CardSubtitle>{item.subtitle}</CardSubtitle>
            </CardContent>
        </ActionCard>
    );
};

// 빠른 실행 카드 기본 데이터 (버전 관리)
const QUICK_ACTIONS_VERSION = 3; // 텍스트 변경 시 버전 증가
const DEFAULT_ITEMS = [
    { id: 'memo', icon: '📝', title: '메모장', subtitle: '언제든 메모' },
    { id: 'calendar', icon: '📅', title: '캘린더', subtitle: '일정 관리' },
    { id: 'secret', icon: '🔒', title: '시크릿', subtitle: '비밀 노트' },
    { id: 'chat', icon: '💬', title: '대화', subtitle: '공유로 협업' }
];

const QuickActions = ({ onSwitchTab }) => {
    const [items, setItems] = useLocalStorage('quick-actions-order', DEFAULT_ITEMS);

    // 버전 체크하여 강제 초기화 (기존 id가 다를 수 있으므로)
    useEffect(() => {
        const savedVersion = localStorage.getItem('quick-actions-version');
        if (savedVersion !== String(QUICK_ACTIONS_VERSION)) {
            // 완전히 기본값으로 초기화
            setItems(DEFAULT_ITEMS);
            localStorage.setItem('quick-actions-version', String(QUICK_ACTIONS_VERSION));
        }
    }, []);

    const [activeId, setActiveId] = useState(null);
    const hasDragged = useRef(false);

    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: {
            distance: 8,
        },
    });

    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: {
            delay: 500,
            tolerance: 5,
        },
    });

    const sensors = useSensors(mouseSensor, touchSensor);


    const handleDragStart = (event) => {
        setActiveId(event.active.id);
        hasDragged.current = false;
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        setActiveId(null);
        hasDragged.current = true;

        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
        hasDragged.current = true;
    };

    const activeItem = activeId ? items.find(item => item.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            modifiers={[restrictToParentElement]}
        >
            <SortableContext
                items={items.map(item => item.id)}
                strategy={rectSortingStrategy}
            >
                <ActionsGrid>
                    {items.map((item) => (
                        <SortableItem
                            key={item.id}
                            item={item}
                            onSwitchTab={onSwitchTab}
                        />
                    ))}
                </ActionsGrid>
            </SortableContext>

            <DragOverlay
                adjustScale={false}
                style={{
                    cursor: 'grabbing',
                }}
            >
                {activeItem && <DragOverlayCard item={activeItem} />}
            </DragOverlay>
        </DndContext>
    );
};

export default QuickActions;