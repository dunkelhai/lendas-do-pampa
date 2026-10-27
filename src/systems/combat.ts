import {
  ENEMIES,
  PLAYER,
  RELICS_CFG,
  STATUS,
  type CardId,
  type EnemyDef,
  type EnemyMove,
} from '../config/balance';
import { CARDS, type CardDef } from './cards';
import { shuffle } from './run';
import type { RelicId } from './relics';

export type Who = 'player' | 'enemy';

export interface Fighter {
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  tempStrength: number;
  dexterity: number;
  vulnerable: number;
  weak: number;
}

export type CombatEvent =
  | { t: 'damage'; who: Who; amount: number; blocked: number }
  | { t: 'block'; who: Who; amount: number }
  | { t: 'status'; who: Who; label: string; good: boolean }
  | { t: 'draw'; count: number }
  | { t: 'shuffle' }
  | { t: 'energy'; amount: number }
  | { t: 'power'; card: CardId };

function fighter(hp: number, maxHp: number): Fighter {
  return {
    hp,
    maxHp,
    block: 0,
    strength: 0,
    tempStrength: 0,
    dexterity: 0,
    vulnerable: 0,
    weak: 0,
  };
}

/** Dano final de um golpe, considerando Força, Fraco e Vulnerável. */
export function calcDamage(attacker: Fighter, target: Fighter, base: number): number {
  let dmg = base + attacker.strength + attacker.tempStrength;
  if (attacker.weak > 0) dmg = Math.floor(dmg * STATUS.weakMult);
  if (target.vulnerable > 0) dmg = Math.floor(dmg * STATUS.vulnerableMult);
  return Math.max(0, dmg);
}

/**
 * Estado e regras de um combate (sem Phaser). Cada ação devolve a lista de
 * eventos para a cena animar.
 */
export class Combat {
  readonly enemyDef: EnemyDef;
  readonly player: Fighter;
  readonly enemy: Fighter;
  drawPile: CardId[];
  hand: CardId[] = [];
  discard: CardId[] = [];
  /** poderes jogados (saem do deck até o fim do combate) */
  powers: CardId[] = [];
  energy = 0;
  turn = 0;
  moveIndex = 0;
  bonusEnergy = 0;
  strengthPerTurn = 0;
  blockPerTurn = 0;
  drawPerTurn = 0;

  constructor(
    enemyId: EnemyDef['id'],
    deck: CardId[],
    hp: number,
    maxHp: number,
    relics: RelicId[],
  ) {
    this.enemyDef = ENEMIES[enemyId];
    this.player = fighter(hp, maxHp);
    this.enemy = fighter(this.enemyDef.maxHp, this.enemyDef.maxHp);
    this.drawPile = shuffle([...deck]);
    if (relics.includes('guampa')) this.player.strength += RELICS_CFG.guampaStrength;
  }

  get won(): boolean {
    return this.enemy.hp <= 0;
  }

  get lost(): boolean {
    return this.player.hp <= 0;
  }

  get currentMove(): EnemyMove {
    return this.enemyDef.moves[this.moveIndex % this.enemyDef.moves.length];
  }

  /** Dano por golpe que a intenção atual causaria agora. */
  intentDamage(): number | null {
    const m = this.currentMove;
    if (m.damage === undefined) return null;
    return calcDamage(this.enemy, this.player, m.damage);
  }

  startPlayerTurn(): CombatEvent[] {
    const ev: CombatEvent[] = [];
    this.turn += 1;
    this.player.block = 0;
    this.energy = PLAYER.energyPerTurn + this.bonusEnergy;
    this.bonusEnergy = 0;
    if (this.strengthPerTurn > 0) {
      this.player.strength += this.strengthPerTurn;
      ev.push({ t: 'status', who: 'player', label: `+${this.strengthPerTurn} Força`, good: true });
    }
    if (this.blockPerTurn > 0) {
      this.player.block += this.blockPerTurn;
      ev.push({ t: 'block', who: 'player', amount: this.blockPerTurn });
    }
    ev.push(...this.drawCards(PLAYER.handSize + this.drawPerTurn));
    return ev;
  }

  drawCards(n: number): CombatEvent[] {
    const ev: CombatEvent[] = [];
    let drawn = 0;
    for (let i = 0; i < n; i++) {
      if (this.hand.length >= PLAYER.maxHand) break;
      if (this.drawPile.length === 0) {
        if (this.discard.length === 0) break;
        this.drawPile = shuffle(this.discard);
        this.discard = [];
        ev.push({ t: 'shuffle' });
      }
      const c = this.drawPile.pop();
      if (c) {
        this.hand.push(c);
        drawn++;
      }
    }
    if (drawn > 0) ev.push({ t: 'draw', count: drawn });
    return ev;
  }

  canPlay(handIndex: number): boolean {
    const id = this.hand[handIndex];
    if (!id) return false;
    return CARDS[id].stats.cost <= this.energy && !this.won && !this.lost;
  }

  playCard(handIndex: number): CombatEvent[] {
    if (!this.canPlay(handIndex)) return [];
    const id = this.hand[handIndex];
    const def: CardDef = CARDS[id];
    const s = def.stats;
    const ev: CombatEvent[] = [];
    this.energy -= s.cost;
    this.hand.splice(handIndex, 1);

    if (s.tempStrength) {
      this.player.tempStrength += s.tempStrength;
      ev.push({ t: 'status', who: 'player', label: `+${s.tempStrength} Força`, good: true });
    }
    if (s.damage !== undefined) {
      const hits = s.hits ?? 1;
      for (let i = 0; i < hits && !this.won; i++) {
        ev.push(this.hit('enemy', calcDamage(this.player, this.enemy, s.damage)));
      }
    }
    if (s.block !== undefined) {
      const amount = s.block + this.player.dexterity;
      this.player.block += amount;
      ev.push({ t: 'block', who: 'player', amount });
    }
    if (s.vulnerable) {
      this.enemy.vulnerable += s.vulnerable;
      ev.push({ t: 'status', who: 'enemy', label: `Vulnerável ${s.vulnerable}`, good: false });
    }
    if (s.weak) {
      this.enemy.weak += s.weak;
      ev.push({ t: 'status', who: 'enemy', label: `Fraco ${s.weak}`, good: false });
    }
    if (s.energy) {
      this.energy += s.energy;
      ev.push({ t: 'energy', amount: s.energy });
    }
    if (s.draw) ev.push(...this.drawCards(s.draw));

    if (def.type === 'poder') {
      this.powers.push(id);
      this.strengthPerTurn += s.powerStrengthPerTurn ?? 0;
      this.blockPerTurn += s.powerBlockPerTurn ?? 0;
      this.drawPerTurn += s.powerDrawPerTurn ?? 0;
      if (s.powerDexterity) this.player.dexterity += s.powerDexterity;
      ev.push({ t: 'power', card: id });
    } else {
      this.discard.push(id);
    }
    return ev;
  }

  private hit(who: Who, amount: number): CombatEvent {
    const f = who === 'player' ? this.player : this.enemy;
    const blocked = Math.min(f.block, amount);
    f.block -= blocked;
    const dmg = amount - blocked;
    f.hp = Math.max(0, f.hp - dmg);
    return { t: 'damage', who, amount: dmg, blocked };
  }

  endPlayerTurn(): void {
    this.discard.push(...this.hand);
    this.hand = [];
    this.player.tempStrength = 0;
  }

  /** Executa o movimento do inimigo. Devolve eventos agrupados por golpe. */
  enemyTurn(): CombatEvent[][] {
    const steps: CombatEvent[][] = [];
    const m = this.currentMove;
    const pVulnBefore = this.player.vulnerable;
    const pWeakBefore = this.player.weak;
    this.enemy.block = 0;

    if (m.block) {
      this.enemy.block += m.block;
      steps.push([{ t: 'block', who: 'enemy', amount: m.block }]);
    }
    if (m.strength) {
      this.enemy.strength += m.strength;
      steps.push([{ t: 'status', who: 'enemy', label: `+${m.strength} Força`, good: true }]);
    }
    if (m.damage !== undefined) {
      const hits = m.hits ?? 1;
      for (let i = 0; i < hits && !this.lost; i++) {
        steps.push([this.hit('player', calcDamage(this.enemy, this.player, m.damage))]);
      }
    }
    if (m.vulnerable) {
      this.player.vulnerable += m.vulnerable;
      steps.push([
        { t: 'status', who: 'player', label: `Vulnerável ${m.vulnerable}`, good: false },
      ]);
    }
    if (m.weak) {
      this.player.weak += m.weak;
      steps.push([{ t: 'status', who: 'player', label: `Fraco ${m.weak}`, good: false }]);
    }

    // fim da rodada: status diminuem (os recém-aplicados no jogador ficam intactos)
    if (pVulnBefore > 0) this.player.vulnerable -= 1;
    if (pWeakBefore > 0) this.player.weak -= 1;
    if (this.enemy.vulnerable > 0) this.enemy.vulnerable -= 1;
    if (this.enemy.weak > 0) this.enemy.weak -= 1;

    this.moveIndex += 1;
    return steps;
  }
}
