import { WritableSignal } from '@angular/core';
import { EventStage } from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';

export const getValidProcessStagesForBulkActions = (
  stages: string[],
  entitySignals: Map<string, WritableSignal<EventStage>>,
  action: 'start' | 'pause' | 'end'
): Array<{ stage: string; sessionId: string }> =>
  stages
    .filter((stage) => {
      const entity = entitySignals.get(stage)?.();
      if (!entity || !entity.isOnline || !entity.currentSessionId) return false;
      switch (action) {
        case 'start':
          return (
            entity.currentAction !== 'SESSION_LIVE_LISTENING' &&
            entity.currentAction !== 'SESSION_END'
          );
        case 'pause':
          return entity.currentAction === 'SESSION_LIVE_LISTENING';
        case 'end':
          return (
            entity.currentAction === 'SESSION_LIVE_LISTENING' ||
            entity.currentAction === 'SESSION_LIVE_LISTENING_PAUSED'
          );
        default:
          return false;
      }
    })
    .map((stage) => ({
      stage,
      sessionId: entitySignals.get(stage)?.()?.currentSessionId,
    }))
    .filter((processStage) => processStage.sessionId);
