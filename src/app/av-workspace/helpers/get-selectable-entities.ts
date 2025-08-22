import { CentralizedViewStage } from 'src/app/av-workspace/data-services/centralized-view-stages/centralized-view-stages.data-model';

export const getSelectableEntities = (
  entities: readonly CentralizedViewStage[]
): CentralizedViewStage[] =>
  entities.filter((entity) => entity.isOnline && entity.currentSessionId);
