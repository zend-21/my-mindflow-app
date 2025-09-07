// src/components/QuickActions.jsx

import React, { useState, useRef } from 'react';
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

const ActionsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
    position: relative;
`;

const ActionCard = styled.div`
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 20px;
    border: 1px solid rgba(255,255,255,0.2);
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
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    ${props => props.$isDragging && `
        transform: rotate(5deg) scale(1.05);
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        background: rgba(255,255,255,0.95);
        z-index: 1000;
        opacity: 0.9;
    `}

    ${props => props.$isOver && `
        background: rgba(74, 144, 226, 0.1);
        border-color: rgba(74, 144, 226, 0.3);
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
    color: #333;
    transition: color 0.2s ease;
`;

const CardSubtitle = styled.div`
    font-size: 12px;
    color: #999;
    margin-top: 2px;
    transition: color 0.2s ease;
`;

const DragOverlayCard = ({ item }) => (
    <ActionCard $isDragging>
        <CardIcon $isDragging>{item.icon}</CardIcon>
        <CardContent>
            <CardTitle>{item.title}</CardTitle>
            <CardSubtitle>{item.subtitle}</CardSubtitle>
        </CardContent>
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

const QuickActions = ({ onSwitchTab }) => {
    const [items, setItems] = useState([
        { id: 'memo', icon: '📝', title: '메모', subtitle: '빠른 생각 정리' },
        { id: 'calendar', icon: '📅', title: '캘린더', subtitle: '일정 관리' },
        { id: 'secret', icon: '🔒', title: '시크릿', subtitle: '비밀 노트' },
        { id: 'review', icon: '🌟', title: '리뷰', subtitle: '한 주 돌아보기' }
    ]);

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