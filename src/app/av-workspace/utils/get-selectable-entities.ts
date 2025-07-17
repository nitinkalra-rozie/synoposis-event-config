import { EventStage } from 'src/app/av-workspace/data-services/event-stages/event-stages.data-model';

export const getSelectableEntities = (entities: EventStage[]): EventStage[] =>
  entities.filter((entity) => entity.isOnline && entity.currentSessionId);
