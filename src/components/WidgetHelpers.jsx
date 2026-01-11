import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as S from '../App.styles';
import StatsGrid from './StatsGrid';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';

/**
 * 위젯 이름에 따라 적절한 컴포넌트 반환
 */
export const getWidgetComponent = (widgetName, props) => {
  switch (widgetName) {
    case 'StatsGrid':
      return <StatsGrid onSwitchTab={props.onSwitchTab} />;
    case 'QuickActions':
      return <QuickActions onSwitchTab={props.onSwitchTab} addActivity={props.addActivity} />;
    case 'RecentActivity':
      const activitiesToDisplay = props.recentActivities.slice(0, props.displayCount);
      return <RecentActivity recentActivities={activitiesToDisplay} deleteActivity={props.deleteActivity} />;
    default:
      return null;
  }
};

/**
 * 드래그 가능한 위젯 컴포넌트
 */
export const DraggableWidget = ({ id, onSwitchTab, addActivity, recentActivities, displayCount, setDisplayCount, deleteActivity }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const componentProps = {
    onSwitchTab,
    addActivity,
    recentActivities,
    displayCount,
    setDisplayCount,
    deleteActivity
  };

  return (
    <S.WidgetWrapper ref={setNodeRef} style={style} $isDragging={isDragging} {...attributes} {...listeners}>
      {getWidgetComponent(id, componentProps)}
    </S.WidgetWrapper>
  );
};
