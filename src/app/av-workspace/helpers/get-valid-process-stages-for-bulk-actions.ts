import { WritableSignal } from '@angular/core';
import { CentralizedViewStage } from 'src/app/av-workspace/data-services/centralized-view-stages/centralized-view-stages.data-model';

export const getValidProcessStagesForBulkActions = (
  stages: string[],
  entitySignals: Map<string, WritableSignal<CentralizedViewStage>>,
  action: 'start' | 'pause' | 'end'
): Array<{ stage: string; sessionId: string }> =>
  stages
    .filter((stage) => {
      const entity = entitySignals.get(stage)?.();
      if (
        !entity ||
        !entity.isOnline ||
        !entity.currentSessionId ||
        entity.autoAv
      )
        return false;
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
