import { CARD_STATS, type CardId, type CardStats } from '../config/balance';

export type CardType = 'ataque' | 'defesa' | 'buff' | 'poder';
export type Rarity = 'comum' | 'incomum' | 'rara';
export type ArtKind =
  | 'relho'
  | 'laco'
  | 'facao'
  | 'boleadeira'
  | 'cavalos'
  | 'vento'
  | 'raio'
  | 'poncho'
  | 'sela'
  | 'galpao'
  | 'sanga'
  | 'esquiva'
  | 'cuia'
  | 'fogo'
  | 'grito'
  | 'olho'
  | 'espiral'
  | 'chaleira'
  | 'pala'
  | 'vela';

export interface CardDef {
  id: CardId;
  name: string;
  type: CardType;
  rarity: Rarity;
  art: ArtKind;
  stats: CardStats;
  /** precisa de alvo inimigo (ataques e debuffs) */
  targetsEnemy: boolean;
}

interface CardMeta {
  name: string;
  type: CardType;
  rarity: Rarity;
  art: ArtKind;
}

const META: Record<CardId, CardMeta> = {
  relhaco: { name: 'Relhaço', type: 'ataque', rarity: 'comum', art: 'relho' },
  lacoCerteiro: { name: 'Laço Certeiro', type: 'ataque', rarity: 'comum', art: 'laco' },
  talhoFacao: { name: 'Talho de Facão', type: 'ataque', rarity: 'comum', art: 'facao' },
  boleadeira: { name: 'Boleadeira', type: 'ataque', rarity: 'comum', art: 'boleadeira' },
  estouroTropilha: {
    name: 'Estouro da Tropilha',
    type: 'ataque',
    rarity: 'incomum',
    art: 'cavalos',
  },
  golpeMinuano: { name: 'Golpe do Minuano', type: 'ataque', rarity: 'incomum', art: 'vento' },
  raioCoxilha: { name: 'Raio na Coxilha', type: 'ataque', rarity: 'rara', art: 'raio' },
  ponchoFirme: { name: 'Poncho Firme', type: 'defesa', rarity: 'comum', art: 'poncho' },
  encilhar: { name: 'Encilhar', type: 'defesa', rarity: 'comum', art: 'sela' },
  galpaoSeguro: { name: 'Galpão Seguro', type: 'defesa', rarity: 'comum', art: 'galpao' },
  sangaEscondida: { name: 'Sanga Escondida', type: 'defesa', rarity: 'incomum', art: 'sanga' },
  esquivaGauderio: {
    name: 'Esquiva Gaudéria',
    type: 'defesa',
    rarity: 'incomum',
    art: 'esquiva',
  },
  mateAmargo: { name: 'Mate Amargo', type: 'buff', rarity: 'comum', art: 'cuia' },
  fogoDeChao: { name: 'Fogo de Chão', type: 'buff', rarity: 'incomum', art: 'fogo' },
  gritoDeGuerra: { name: 'Grito de Guerra', type: 'buff', rarity: 'comum', art: 'grito' },
  olharCarbunculo: {
    name: 'Olhar do Carbúnculo',
    type: 'buff',
    rarity: 'incomum',
    art: 'olho',
  },
  espiritoMinuano: {
    name: 'Espírito do Minuano',
    type: 'poder',
    rarity: 'rara',
    art: 'espiral',
  },
  chimarraoQuente: {
    name: 'Chimarrão Quente',
    type: 'poder',
    rarity: 'incomum',
    art: 'chaleira',
  },
  palaEncantado: { name: 'Pala Encantado', type: 'poder', rarity: 'incomum', art: 'pala' },
  velaPastoreio: { name: 'Vela Benta', type: 'poder', rarity: 'rara', art: 'vela' },
};

export const CARDS: Record<CardId, CardDef> = Object.fromEntries(
  (Object.keys(META) as CardId[]).map((id) => {
    const stats: CardStats = CARD_STATS[id];
    const meta = META[id];
    const targetsEnemy =
      stats.damage !== undefined ||
      (meta.type === 'buff' && (stats.vulnerable !== undefined || stats.weak !== undefined));
    return [id, { id, ...meta, stats, targetsEnemy }];
  }),
) as Record<CardId, CardDef>;

export const ALL_CARD_IDS = Object.keys(CARDS) as CardId[];

/** Um trecho de texto da carta; `color` destaca números de efeito. */
export interface TextPart {
  text: string;
  color?: 'dano' | 'bloqueio' | 'buff';
}

/** Texto descritivo da carta em linhas, cada linha composta de partes. */
export function describeCard(def: CardDef): TextPart[][] {
  const s = def.stats;
  const lines: TextPart[][] = [];
  if (s.damage !== undefined) {
    const hits = s.hits && s.hits > 1 ? `×${s.hits}` : '';
    lines.push([
      { text: 'Cause ' },
      { text: `${s.damage}${hits}`, color: 'dano' },
      { text: ' de dano.' },
    ]);
  }
  if (s.block !== undefined) {
    lines.push([
      { text: 'Ganhe ' },
      { text: `${s.block}`, color: 'bloqueio' },
      { text: ' de bloqueio.' },
    ]);
  }
  if (s.vulnerable !== undefined) {
    lines.push([
      { text: 'Aplique ' },
      { text: `${s.vulnerable}`, color: 'buff' },
      { text: ' Vulnerável.' },
    ]);
  }
  if (s.weak !== undefined) {
    lines.push([{ text: 'Aplique ' }, { text: `${s.weak}`, color: 'buff' }, { text: ' Fraco.' }]);
  }
  if (s.energy !== undefined) {
    lines.push([
      { text: 'Ganhe ' },
      { text: `${s.energy}`, color: 'buff' },
      { text: ' de energia.' },
    ]);
  }
  if (s.draw !== undefined) {
    lines.push([
      { text: 'Compre ' },
      { text: `${s.draw}`, color: 'buff' },
      { text: s.draw > 1 ? ' cartas.' : ' carta.' },
    ]);
  }
  if (s.tempStrength !== undefined) {
    lines.push([
      { text: '+' },
      { text: `${s.tempStrength}`, color: 'dano' },
      { text: ' Força neste turno.' },
    ]);
  }
  if (s.powerStrengthPerTurn !== undefined) {
    lines.push([
      { text: 'Início do turno: +' },
      { text: `${s.powerStrengthPerTurn}`, color: 'dano' },
      { text: ' Força.' },
    ]);
  }
  if (s.powerBlockPerTurn !== undefined) {
    lines.push([
      { text: 'Início do turno: ganhe ' },
      { text: `${s.powerBlockPerTurn}`, color: 'bloqueio' },
      { text: ' de bloqueio.' },
    ]);
  }
  if (s.powerDexterity !== undefined) {
    lines.push([
      { text: 'Cartas de defesa dão +' },
      { text: `${s.powerDexterity}`, color: 'bloqueio' },
      { text: ' bloqueio.' },
    ]);
  }
  if (s.powerDrawPerTurn !== undefined) {
    lines.push([
      { text: 'Compre +' },
      { text: `${s.powerDrawPerTurn}`, color: 'buff' },
      { text: ' carta por turno.' },
    ]);
  }
  return lines;
}

export const TYPE_LABEL: Record<CardType, string> = {
  ataque: 'ATAQUE',
  defesa: 'DEFESA',
  buff: 'HABILIDADE',
  poder: 'PODER',
};
