import { RELICS_CFG } from '../config/balance';

export type RelicId = 'carbunculo' | 'guampa';

export interface RelicDef {
  id: RelicId;
  name: string;
  text: string;
}

export const RELICS: Record<RelicId, RelicDef> = {
  carbunculo: {
    id: 'carbunculo',
    name: 'Lasca de Carbúnculo',
    text: `Ao vencer um combate, cure ${RELICS_CFG.carbunculoHealOnWin} de vida.`,
  },
  guampa: {
    id: 'guampa',
    name: 'Guampa do Avô',
    text: `Comece cada combate com ${RELICS_CFG.guampaStrength} de Força.`,
  },
};

export const ALL_RELICS = Object.keys(RELICS) as RelicId[];
