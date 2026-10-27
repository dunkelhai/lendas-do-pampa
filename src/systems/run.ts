import { PLAYER, STARTER_DECK, type CardId } from '../config/balance';
import { ALL_RELICS, type RelicId } from './relics';

export interface RunStats {
  turns: number;
  cardsPlayed: number;
  damageDealt: number;
  startTime: number;
}

export interface RunState {
  hp: number;
  maxHp: number;
  deck: CardId[];
  relics: RelicId[];
  /** índice do nó atual no mapa (0..4); nós < node já foram vencidos */
  node: number;
  /** relíquia guardada para o evento */
  eventRelic: RelicId;
  stats: RunStats;
}

function makeRun(): RunState {
  // As 2 relíquias são sorteadas: uma vem de início, a outra fica para o evento.
  const shuffled = shuffle([...ALL_RELICS]);
  return {
    hp: PLAYER.maxHp,
    maxHp: PLAYER.maxHp,
    deck: [...STARTER_DECK],
    relics: [shuffled[0]],
    node: 0,
    eventRelic: shuffled[1],
    stats: { turns: 0, cardsPlayed: 0, damageDealt: 0, startTime: Date.now() },
  };
}

export let run: RunState = makeRun();

export function newRun(): RunState {
  run = makeRun();
  return run;
}

export function hasRelic(id: RelicId): boolean {
  return run.relics.includes(id);
}

export function heal(amount: number): number {
  const before = run.hp;
  run.hp = Math.min(run.maxHp, run.hp + amount);
  return run.hp - before;
}

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function elapsedText(): string {
  const s = Math.floor((Date.now() - run.stats.startTime) / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
