/**
 * TODAS as constantes de balanceamento do jogo ficam aqui.
 * Meta: uma run vencível em ~10–15 min por quem joga com cuidado.
 */

export const PLAYER = {
  maxHp: 70,
  energyPerTurn: 3,
  handSize: 5,
  maxHand: 10,
} as const;

/** Multiplicadores de status (padrão do gênero). */
export const STATUS = {
  vulnerableMult: 1.5,
  weakMult: 0.75,
} as const;

/** Valores numéricos de cada carta (nome/texto/arte ficam em systems/cards.ts). */
export interface CardStats {
  cost: number;
  damage?: number;
  hits?: number;
  block?: number;
  draw?: number;
  energy?: number;
  tempStrength?: number;
  vulnerable?: number;
  weak?: number;
  /** poderes: efeito permanente no combate */
  powerStrengthPerTurn?: number;
  powerBlockPerTurn?: number;
  powerDexterity?: number;
  powerDrawPerTurn?: number;
}

export const CARD_STATS = {
  // ataque
  relhaco: { cost: 1, damage: 6 },
  lacoCerteiro: { cost: 2, damage: 8, vulnerable: 2 },
  talhoFacao: { cost: 1, damage: 9 },
  boleadeira: { cost: 1, damage: 4, hits: 2 },
  estouroTropilha: { cost: 2, damage: 5, hits: 3 },
  golpeMinuano: { cost: 2, damage: 14, weak: 1 },
  raioCoxilha: { cost: 3, damage: 24 },
  // defesa
  ponchoFirme: { cost: 1, block: 5 },
  encilhar: { cost: 1, block: 8 },
  galpaoSeguro: { cost: 2, block: 13 },
  sangaEscondida: { cost: 1, block: 6, draw: 1 },
  esquivaGauderio: { cost: 1, block: 4, weak: 2 },
  // buff (habilidade)
  mateAmargo: { cost: 0, draw: 2 },
  fogoDeChao: { cost: 1, energy: 2, draw: 1 },
  gritoDeGuerra: { cost: 1, tempStrength: 4 },
  olharCarbunculo: { cost: 1, vulnerable: 2, weak: 2 },
  // poder
  espiritoMinuano: { cost: 2, powerStrengthPerTurn: 1 },
  chimarraoQuente: { cost: 1, powerBlockPerTurn: 4 },
  palaEncantado: { cost: 1, powerDexterity: 2 },
  velaPastoreio: { cost: 2, powerDrawPerTurn: 1 },
} as const satisfies Record<string, CardStats>;

export type CardId = keyof typeof CARD_STATS;

export const STARTER_DECK: CardId[] = [
  'relhaco',
  'relhaco',
  'relhaco',
  'relhaco',
  'relhaco',
  'ponchoFirme',
  'ponchoFirme',
  'ponchoFirme',
  'ponchoFirme',
  'lacoCerteiro',
];

/** Cartas básicas não aparecem nas recompensas. */
export const BASIC_CARDS: CardId[] = ['relhaco', 'ponchoFirme', 'lacoCerteiro'];

export const REWARD = {
  choices: 3,
  /** peso de sorteio por raridade */
  rarityWeight: { comum: 6, incomum: 3, rara: 1.5 },
} as const;

export const RELICS_CFG = {
  carbunculoHealOnWin: 6,
  guampaStrength: 1,
} as const;

export const EVENT_CFG = {
  healPercent: 0.3,
} as const;

// ---------------- inimigos ----------------

export type IntentKind = 'attack' | 'defend' | 'buff' | 'debuff';

export interface EnemyMove {
  name: string;
  kind: IntentKind;
  damage?: number;
  hits?: number;
  block?: number;
  strength?: number;
  vulnerable?: number;
  weak?: number;
}

export interface EnemyDef {
  id: 'negrinho' | 'lobisomem' | 'teiniagua' | 'salamanca';
  name: string;
  maxHp: number;
  /** padrão em ciclo; o primeiro movimento é o do turno 1 */
  moves: EnemyMove[];
}

export const ENEMIES: Record<EnemyDef['id'], EnemyDef> = {
  negrinho: {
    id: 'negrinho',
    name: 'Negrinho do Pastoreio',
    maxHp: 36,
    moves: [
      { name: 'Tropilha em Disparada', kind: 'attack', damage: 6 },
      { name: 'Vela Acesa', kind: 'buff', block: 6, strength: 2 },
      { name: 'Coice do Baio', kind: 'attack', damage: 4, hits: 2 },
    ],
  },
  lobisomem: {
    id: 'lobisomem',
    name: 'Lobisomem da Coxilha',
    maxHp: 46,
    moves: [
      { name: 'Uivo de Sexta-feira', kind: 'buff', strength: 2 },
      { name: 'Garra Funda', kind: 'attack', damage: 9 },
      { name: 'Mordida Dupla', kind: 'attack', damage: 5, hits: 2 },
      { name: 'Pelo Eriçado', kind: 'defend', block: 8 },
    ],
  },
  teiniagua: {
    id: 'teiniagua',
    name: 'Teiniaguá',
    maxHp: 44,
    moves: [
      { name: 'Encanto Esmeralda', kind: 'debuff', weak: 2 },
      { name: 'Chicote de Cauda', kind: 'attack', damage: 8 },
      { name: 'Escamas de Cristal', kind: 'defend', block: 10 },
      { name: 'Brilho do Carbúnculo', kind: 'attack', damage: 6, vulnerable: 1 },
    ],
  },
  salamanca: {
    id: 'salamanca',
    name: 'Salamanca do Jarau',
    maxHp: 110,
    moves: [
      { name: 'Bafo de Brasa', kind: 'attack', damage: 12 },
      { name: 'Muralha de Pedra', kind: 'defend', block: 12, strength: 2 },
      { name: 'Feitiço da Furna', kind: 'debuff', vulnerable: 1, weak: 2 },
      { name: 'Desmoronamento', kind: 'attack', damage: 5, hits: 3 },
    ],
  },
};

/** Sequência fixa do mapa (5 nós). */
export type MapNode =
  | { kind: 'combat'; enemy: EnemyDef['id'] }
  | { kind: 'event' }
  | { kind: 'boss'; enemy: EnemyDef['id'] };

export const MAP_NODES: MapNode[] = [
  { kind: 'combat', enemy: 'negrinho' },
  { kind: 'combat', enemy: 'lobisomem' },
  { kind: 'event' },
  { kind: 'combat', enemy: 'teiniagua' },
  { kind: 'boss', enemy: 'salamanca' },
];

/** Duração de animações de jogo (ms). */
export const TIMING = {
  cardFly: 220,
  enemyActDelay: 450,
  enemyHitGap: 220,
  turnBanner: 700,
} as const;

/** Dano acima disso dispara shake forte. */
export const STRONG_HIT = 20;
