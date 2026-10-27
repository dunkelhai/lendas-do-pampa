import Phaser from 'phaser';
import {
  ENEMIES,
  MAP_NODES,
  PLAYER,
  RELICS_CFG,
  STRONG_HIT,
  TIMING,
  type CardId,
  type EnemyDef,
} from '../config/balance';
import { CARD_W, FRAME, cardKey } from '../entities/cardTexture';
import { PampaBackground, addVignette, stageForNode } from '../entities/PampaBackground';
import { RunHud } from '../entities/RunHud';
import { FONT_TITLE, FONT_UI, PAL, PALS } from '../style/palette';
import { sfx } from '../systems/audio';
import { CARDS } from '../systems/cards';
import { Combat, type CombatEvent, type Fighter, type Who } from '../systems/combat';
import { bindCommonKeys, showEnd } from '../systems/flow';
import { floatText, goto, hitFlash, pop, screenFlash, shake } from '../systems/fx';
import { hasRelic, run } from '../systems/run';
import { isDebug } from '../systems/settings';
import { ENEMY_ART } from '../systems/textures';
import { Bar, button, uiText } from '../systems/ui';

const PLAYER_X = 290;
const ENEMY_X = 920;
const GROUND_Y = 400;
const HAND_Y = 610;
const DRAW_PILE = { x: 64, y: 650 };
const DISCARD_PILE = { x: 1216, y: 650 };
const PLAY_LINE_Y = 420;
const ENEMY_SCALE: Record<EnemyDef['id'], number> = {
  negrinho: 0.9,
  lobisomem: 0.85,
  teiniagua: 1,
  salamanca: 0.88,
};

interface CardObj {
  id: CardId;
  img: Phaser.GameObjects.Image;
}

interface FighterView {
  root: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  bar: Bar;
  blockIcon: Phaser.GameObjects.Image;
  blockText: Phaser.GameObjects.Text;
  status: Phaser.GameObjects.Text;
  center: () => { x: number; y: number };
}

export class CombatScene extends Phaser.Scene {
  private combat!: Combat;
  private enemyId!: EnemyDef['id'];
  private hud!: RunHud;
  private cards: CardObj[] = [];
  private focus = -1;
  private busy = true;
  private dragging: CardObj | null = null;
  private dragTarget = { x: 0, y: 0 };
  private ended = false;

  private playerV!: FighterView;
  private enemyV!: FighterView;
  private intent!: Phaser.GameObjects.Container;
  private intentY = 0;
  private energyOrb!: Phaser.GameObjects.Container;
  private energyText!: Phaser.GameObjects.Text;
  private drawCount!: Phaser.GameObjects.Text;
  private discardCount!: Phaser.GameObjects.Text;
  private powersText!: Phaser.GameObjects.Text;
  private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private targetRing!: Phaser.GameObjects.Ellipse;
  private playZone!: Phaser.GameObjects.Graphics;
  private endBtn!: ReturnType<typeof button>;

  constructor() {
    super('Combat');
  }

  init(data: { enemy: EnemyDef['id'] }): void {
    this.enemyId = data.enemy;
    this.cards = [];
    this.focus = -1;
    this.busy = true;
    this.dragging = null;
    this.ended = false;
  }

  create(): void {
    this.cameras.main.fadeIn(250);
    this.combat = new Combat(this.enemyId, run.deck, run.hp, run.maxHp, run.relics);
    new PampaBackground(this, stageForNode(run.node));
    addVignette(this);
    const isBoss = MAP_NODES[run.node]?.kind === 'boss';
    this.hud = new RunHud(this, '');
    this.updateCenter();
    uiText(
      this,
      640,
      66,
      '←/→ selecionar · Z/Espaço jogar · X/Shift/E encerrar turno',
      16,
      PALS.pelePapel,
      '700',
    )
      .setAlpha(0.85)
      .setDepth(501);

    this.playZone = this.add.graphics().setDepth(5).setVisible(false);
    this.playZone
      .fillStyle(PAL.pelePapel, 0.08)
      .fillRoundedRect(60, 96, 1160, PLAY_LINE_Y - 110, 24);
    this.playZone
      .lineStyle(3, PAL.pelePapel, 0.5)
      .strokeRoundedRect(60, 96, 1160, PLAY_LINE_Y - 110, 24);

    this.playerV = this.makeFighter('player', PLAYER_X, 'player', 1, 280);
    const art = ENEMY_ART[this.enemyId];
    const scale = ENEMY_SCALE[this.enemyId];
    this.enemyV = this.makeFighter('enemy', ENEMY_X, art.key, scale, art.h);
    for (const l of art.lights) {
      const light = this.add
        .image((l.x - art.w / 2) * scale, -(art.h - l.y) * scale, 'light')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(l.color)
        .setScale(l.scale)
        .setAlpha(0.6);
      this.enemyV.root.add(light);
      this.tweens.add({
        targets: light,
        alpha: { from: 0.4, to: 0.85 },
        scale: { from: l.scale * 0.95, to: l.scale * 1.08 },
        duration: 380 + Math.random() * 300,
        yoyo: true,
        repeat: -1,
      });
    }
    if (isBoss && this.renderer.type === Phaser.WEBGL) {
      this.enemyV.sprite.preFX?.addGlow(PAL.brasa, 4, 0);
    }
    this.targetRing = this.add
      .ellipse(ENEMY_X, GROUND_Y - (art.h * scale) / 2, art.w * scale + 40, art.h * scale + 30)
      .setStrokeStyle(5, PAL.ouro)
      .setDepth(6)
      .setVisible(false);
    // intenção acima da cabeça; se não couber abaixo do HUD, fica ao lado da criatura
    let intentX = ENEMY_X;
    this.intentY = GROUND_Y - art.h * scale - 34;
    if (this.intentY < 112) {
      intentX = ENEMY_X - (art.w * scale) / 2 - 40;
      this.intentY = GROUND_Y - art.h * scale * 0.62;
    }
    this.intent = this.add.container(intentX, this.intentY).setDepth(30);
    this.tweens.add({
      targets: this.intent,
      y: this.intentY - 4,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.powersText = this.add
      .text(40, 96, '', {
        fontFamily: FONT_UI,
        fontStyle: '800',
        fontSize: '18px',
        color: PALS.pelePapel,
        stroke: PALS.tinta,
        strokeThickness: 4,
      })
      .setDepth(40);

    // energia
    const orbG = this.add.graphics();
    orbG.fillStyle(PAL.tinta, 1).fillCircle(3, 5, 46);
    orbG.fillStyle(PAL.jogador, 1).fillCircle(0, 0, 44);
    orbG.fillStyle(PAL.ouroClaro, 0.35).fillCircle(-14, -16, 16);
    orbG.lineStyle(4, PAL.tinta, 1).strokeCircle(0, 0, 44);
    this.energyText = this.add
      .text(0, 2, '', {
        fontFamily: FONT_TITLE,
        fontSize: '40px',
        color: PALS.branco,
        stroke: PALS.tinta,
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.energyOrb = this.add.container(150, 540, [orbG, this.energyText]).setDepth(40);
    uiText(this, 150, 598, 'ENERGIA', 16, PALS.pelePapel).setDepth(40);

    // pilhas
    this.add.image(DRAW_PILE.x, DRAW_PILE.y, 'pile').setDepth(40);
    this.drawCount = uiText(this, DRAW_PILE.x + 26, DRAW_PILE.y + 34, '0', 22, PALS.ouro).setDepth(
      41,
    );
    uiText(this, DRAW_PILE.x, DRAW_PILE.y - 62, 'Compra', 16, PALS.pelePapel).setDepth(41);
    this.add.image(DISCARD_PILE.x, DISCARD_PILE.y, 'pile').setDepth(40).setTint(PAL.comum);
    this.discardCount = uiText(
      this,
      DISCARD_PILE.x - 26,
      DISCARD_PILE.y + 34,
      '0',
      22,
      PALS.ouro,
    ).setDepth(41);
    uiText(this, DISCARD_PILE.x, DISCARD_PILE.y - 62, 'Descarte', 16, PALS.pelePapel).setDepth(41);

    this.endBtn = button(
      this,
      1130,
      548,
      'Encerrar turno',
      () => void this.endTurn(),
      210,
      56,
      PAL.buffFaixa,
    );
    this.endBtn.container.setDepth(45);

    this.emitter = this.add
      .particles(0, 0, 'spark', {
        speed: { min: 120, max: 260 },
        lifespan: { min: 250, max: 450 },
        scale: { start: 1, end: 0 },
        emitting: false,
      })
      .setDepth(700);

    this.setupInput();
    bindCommonKeys(this);
    this.refreshAll();
    this.showIntent();
    this.time.delayedCall(350, () => void this.startTurn());
  }

  // ------------------------------------------------------------ montagem

  private makeFighter(who: Who, x: number, key: string, scale: number, h: number): FighterView {
    const sprite = this.add.image(0, 0, key).setOrigin(0.5, 1).setScale(scale);
    const shadow = this.add.ellipse(0, 0, sprite.displayWidth * 0.8, 26, PAL.tinta, 0.3);
    const root = this.add.container(x, GROUND_Y, [shadow, sprite]).setDepth(10);
    const breath = 1400 + Math.random() * 600;
    this.tweens.add({
      targets: root,
      scaleY: 1.03,
      scaleX: 0.99,
      duration: breath,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const bar = new Bar(
      this,
      x - 110,
      GROUND_Y + 14,
      220,
      26,
      who === 'enemy' ? PAL.inimigo : PAL.perigo,
    ).setDepth(20);
    const blockIcon = this.add
      .image(x - 138, GROUND_Y + 27, 'intent-defend')
      .setDepth(21)
      .setVisible(false);
    const blockText = this.add
      .text(x - 138, GROUND_Y + 29, '', {
        fontFamily: FONT_TITLE,
        fontSize: '24px',
        color: PALS.branco,
        stroke: PALS.tinta,
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(22);
    const status = this.add
      .text(x, GROUND_Y + 58, '', {
        fontFamily: FONT_UI,
        fontStyle: '800',
        fontSize: '18px',
        color: PALS.ouro,
        stroke: PALS.tinta,
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(20);
    return {
      root,
      sprite,
      bar,
      blockIcon,
      blockText,
      status,
      center: () => ({ x: root.x, y: GROUND_Y - (h * scale) / 2 }),
    };
  }

  private setupInput(): void {
    const kb = this.input.keyboard;
    if (kb) {
      const left = () => this.moveFocus(-1);
      const right = () => this.moveFocus(1);
      kb.on('keydown-LEFT', left);
      kb.on('keydown-A', left);
      kb.on('keydown-RIGHT', right);
      kb.on('keydown-D', right);
      const play = () => {
        if (this.busy || this.dragging || this.cards.length === 0) return;
        if (this.focus < 0) {
          this.setFocus(0);
          return;
        }
        void this.playCard(this.focus);
      };
      kb.on('keydown-Z', play);
      kb.on('keydown-SPACE', play);
      const end = () => void this.endTurn();
      kb.on('keydown-X', end);
      kb.on('keydown-SHIFT', end);
      kb.on('keydown-E', end);
      if (isDebug) {
        kb.addKey('F3', true);
        kb.addKey('F4', true);
        kb.on('keydown-F3', () => {
          if (this.ended) return;
          this.combat.enemy.hp = 0;
          void this.onWin();
        });
        kb.on('keydown-F4', () => {
          this.combat.energy += 99;
          this.refreshAll();
          pop(this, this.energyOrb);
        });
      }
    }

    this.input.on(
      'drag',
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
        if (this.dragging?.img !== obj) return;
        this.dragTarget = { x: dragX, y: dragY };
        this.updateDragHighlight(dragX, dragY);
      },
    );
    this.input.on('dragstart', (p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      const c = this.cards.find((k) => k.img === obj);
      if (!c || this.busy) return;
      const idx = this.cards.indexOf(c);
      if (!this.combat.canPlay(idx)) {
        this.noEnergy(c);
        return;
      }
      this.dragging = c;
      this.dragTarget = { x: p.x, y: p.y };
      this.tweens.killTweensOf(obj);
      obj.setDepth(400);
      this.tweens.add({ targets: obj, angle: 0, scale: 0.9, duration: 120, ease: 'Quad.easeOut' });
      this.showDragZones(CARDS[c.id].targetsEnemy);
    });
    this.input.on('dragend', (p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      const c = this.dragging;
      if (!c || c.img !== obj) return;
      this.dragging = null;
      this.hideDragZones();
      const idx = this.cards.indexOf(c);
      if (idx >= 0 && this.isValidDrop(c, p.x, p.y)) {
        void this.playCard(idx);
      } else {
        this.layoutHand();
      }
    });
  }

  update(): void {
    const d = this.dragging;
    if (!d) return;
    d.img.x += (this.dragTarget.x - d.img.x) * 0.35;
    d.img.y += (this.dragTarget.y - d.img.y) * 0.35;
  }

  // ------------------------------------------------------------ mão

  private handPos(i: number, n: number): { x: number; y: number; angle: number } {
    const spacing = Math.min(CARD_W * 0.62, 760 / Math.max(1, n - 1));
    const k = i - (n - 1) / 2;
    const dx = k * spacing;
    const R = 1400;
    return {
      x: 640 + dx,
      y: HAND_Y + (R - Math.sqrt(R * R - dx * dx)),
      angle: Phaser.Math.Clamp(k * 4, -18, 18),
    };
  }

  private layoutHand(newFrom = -1): void {
    const n = this.cards.length;
    this.cards.forEach((c, i) => {
      if (c === this.dragging) return;
      const p = this.handPos(i, n);
      const focused = i === this.focus;
      this.tweens.killTweensOf(c.img);
      c.img.setDepth(focused ? 300 : 100 + i);
      const delay = newFrom >= 0 && i >= newFrom ? (i - newFrom) * 70 : 0;
      this.tweens.add({
        targets: c.img,
        x: p.x,
        y: focused ? HAND_Y - 70 : p.y,
        angle: focused ? 0 : p.angle,
        scale: focused ? 1.25 : 1,
        duration: newFrom >= 0 && i >= newFrom ? 260 : 160,
        delay,
        ease: 'Quad.easeOut',
      });
      const playable = this.combat.canPlay(i);
      c.img.setAlpha(playable || this.busy ? 1 : 0.75);
    });
  }

  private syncHand(): void {
    const start = this.cards.length;
    for (let i = start; i < this.combat.hand.length; i++) {
      const id = this.combat.hand[i];
      const img = this.add
        .image(DRAW_PILE.x, DRAW_PILE.y, cardKey(id))
        .setScale(0.3)
        .setDepth(100 + i)
        .setInteractive({ useHandCursor: true, draggable: true });
      const obj: CardObj = { id, img };
      img.on('pointerover', () => {
        if (this.dragging || this.busy) return;
        this.setFocus(this.cards.indexOf(obj));
      });
      img.on('pointerout', () => {
        if (this.dragging) return;
        if (this.cards[this.focus] === obj) this.setFocus(-1);
      });
      this.cards.push(obj);
    }
    if (this.combat.hand.length > start) this.layoutHand(start);
  }

  private setFocus(i: number): void {
    if (i === this.focus) return;
    this.focus = i;
    if (i >= 0) sfx.select();
    this.layoutHand();
  }

  private moveFocus(d: number): void {
    if (this.busy || this.dragging || this.cards.length === 0) return;
    const n = this.cards.length;
    if (this.focus < 0) this.setFocus(d > 0 ? 0 : n - 1);
    else this.setFocus((this.focus + d + n) % n);
  }

  private noEnergy(c: CardObj): void {
    floatText(this, c.img.x, c.img.y - 150, 'Sem energia!', PALS.perigo, 30);
    this.tweens.add({ targets: c.img, x: c.img.x + 8, duration: 50, yoyo: true, repeat: 2 });
    pop(this, this.energyOrb);
  }

  // ------------------------------------------------------------ arrasto

  private enemyRect(): Phaser.Geom.Rectangle {
    const b = this.enemyV.sprite.getBounds();
    return new Phaser.Geom.Rectangle(b.x - 40, b.y - 40, b.width + 80, b.height + 80);
  }

  private isValidDrop(c: CardObj, x: number, y: number): boolean {
    if (CARDS[c.id].targetsEnemy) return this.enemyRect().contains(x, y);
    return y < PLAY_LINE_Y;
  }

  private showDragZones(targeted: boolean): void {
    if (targeted) {
      this.targetRing.setVisible(true).setAlpha(0.45);
    } else {
      this.playZone.setVisible(true);
    }
  }

  private updateDragHighlight(x: number, y: number): void {
    const c = this.dragging;
    if (!c) return;
    const ok = this.isValidDrop(c, x, y);
    if (CARDS[c.id].targetsEnemy) this.targetRing.setAlpha(ok ? 1 : 0.45);
    else this.playZone.setAlpha(ok ? 1 : 0.5);
  }

  private hideDragZones(): void {
    this.targetRing.setVisible(false);
    this.playZone.setVisible(false);
  }

  // ------------------------------------------------------------ fluxo de turno

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  private banner(text: string, color: string): void {
    const t = this.add
      .text(640, 250, text, {
        fontFamily: FONT_TITLE,
        fontSize: '64px',
        color,
        stroke: PALS.tinta,
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(850)
      .setScale(0.6);
    this.tweens.add({ targets: t, scale: 1, duration: 250, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: t,
      alpha: 0,
      delay: TIMING.turnBanner - 250,
      duration: 250,
      onComplete: () => t.destroy(),
    });
  }

  private async startTurn(): Promise<void> {
    if (this.ended) return;
    this.busy = true;
    run.stats.turns += 1;
    sfx.turn();
    this.banner(`Turno ${this.combat.turn + 1}`, PALS.pelePapel);
    const ev = this.combat.startPlayerTurn();
    this.updateCenter();
    await this.playEvents(ev);
    this.busy = false;
    this.focus = -1;
    this.layoutHand();
    this.refreshAll();
  }

  private async playCard(index: number): Promise<void> {
    if (this.busy || this.ended) return;
    const c = this.cards[index];
    if (!c) return;
    if (!this.combat.canPlay(index)) {
      this.noEnergy(c);
      this.layoutHand();
      return;
    }
    this.busy = true;
    const def = CARDS[c.id];
    this.cards.splice(index, 1);
    const ev = this.combat.playCard(index);
    run.stats.cardsPlayed += 1;
    this.focus = this.cards.length === 0 ? -1 : Math.min(index, this.cards.length - 1);
    this.refreshAll();
    this.layoutHand();

    const target = def.targetsEnemy ? this.enemyV.center() : this.playerV.center();
    sfx.card();
    this.tweens.killTweensOf(c.img);
    c.img.disableInteractive();
    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: c.img,
        x: target.x,
        y: target.y,
        scale: 0.35,
        angle: def.targetsEnemy ? 20 : -10,
        duration: TIMING.cardFly,
        ease: 'Cubic.easeIn',
        onComplete: () => resolve(),
      });
    });
    this.burst(target.x, target.y, FRAME[def.type].frame, 12);
    c.img.destroy();
    await this.playEvents(ev);
    this.refreshAll();
    this.showIntent(false);
    if (this.combat.won) {
      await this.onWin();
      return;
    }
    this.busy = false;
    this.layoutHand();
  }

  private async endTurn(): Promise<void> {
    if (this.busy || this.ended || this.dragging) return;
    this.busy = true;
    this.focus = -1;
    this.combat.endPlayerTurn();
    const leaving = this.cards;
    this.cards = [];
    leaving.forEach((c, i) => {
      c.img.disableInteractive();
      this.tweens.killTweensOf(c.img);
      this.tweens.add({
        targets: c.img,
        x: DISCARD_PILE.x,
        y: DISCARD_PILE.y,
        scale: 0.25,
        angle: 30,
        delay: i * 45,
        duration: 260,
        ease: 'Cubic.easeIn',
        onComplete: () => c.img.destroy(),
      });
    });
    this.refreshAll();
    await this.wait(320 + leaving.length * 45);

    this.banner('Turno do inimigo', PALS.perigo);
    await this.wait(TIMING.enemyActDelay);
    const steps = this.combat.enemyTurn();
    for (const step of steps) {
      const attacks = step.some((e) => e.t === 'damage' && e.who === 'player');
      if (attacks) await this.lunge();
      await this.playEvents(step);
      if (this.combat.lost) break;
      await this.wait(TIMING.enemyHitGap);
    }
    this.refreshAll();
    if (this.combat.lost) {
      await this.onLose();
      return;
    }
    this.showIntent();
    await this.wait(250);
    await this.startTurn();
  }

  private lunge(): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({
        targets: this.enemyV.root,
        x: ENEMY_X - 60,
        duration: 110,
        ease: 'Quad.easeIn',
        yoyo: true,
        onYoyo: () => resolve(),
      });
    });
  }

  private async onWin(): Promise<void> {
    if (this.ended) return;
    this.ended = true;
    this.busy = true;
    this.hideDragZones();
    const isBoss = MAP_NODES[run.node]?.kind === 'boss';
    const c = this.enemyV.center();
    this.burst(c.x, c.y, PAL.ouro, 14);
    this.tweens.add({
      targets: this.enemyV.root,
      alpha: 0,
      y: GROUND_Y - 40,
      duration: 700,
      ease: 'Quad.easeIn',
    });
    this.intent.setVisible(false);
    sfx.win();
    this.banner(this.enemyId === 'negrinho' ? 'Provação vencida!' : 'Vitória!', PALS.ouro);
    run.hp = this.combat.player.hp;
    if (hasRelic('carbunculo')) {
      const before = run.hp;
      run.hp = Math.min(run.maxHp, run.hp + RELICS_CFG.carbunculoHealOnWin);
      if (run.hp > before)
        floatText(this, PLAYER_X, GROUND_Y - 300, `+${run.hp - before} vida`, PALS.buff, 32);
    }
    this.hud.refresh();
    run.node += 1;
    await this.wait(1100);
    if (isBoss) showEnd(this, true);
    else goto(this, 'Reward');
  }

  private async onLose(): Promise<void> {
    if (this.ended) return;
    this.ended = true;
    run.hp = 0;
    this.tweens.add({
      targets: this.playerV.root,
      angle: -80,
      alpha: 0.4,
      duration: 600,
      ease: 'Quad.easeIn',
    });
    await this.wait(800);
    showEnd(this, false);
  }

  // ------------------------------------------------------------ eventos visuais

  private viewOf(who: Who): FighterView {
    return who === 'player' ? this.playerV : this.enemyV;
  }

  private async playEvents(ev: CombatEvent[]): Promise<void> {
    for (const e of ev) {
      switch (e.t) {
        case 'damage': {
          const v = this.viewOf(e.who);
          const c = v.center();
          if (e.blocked > 0)
            floatText(this, c.x + 70, c.y - 30, `-${e.blocked} bloq.`, PALS.jogador, 26);
          if (e.amount > 0) {
            hitFlash(this, v.sprite);
            floatText(
              this,
              c.x,
              c.y - 40,
              `${e.amount}`,
              PALS.perigo,
              e.amount > STRONG_HIT ? 64 : 48,
            );
            this.burst(c.x, c.y, e.who === 'enemy' ? PAL.perigo : PAL.ouro, 10);
            const dir = e.who === 'enemy' ? 1 : -1;
            const baseX = e.who === 'enemy' ? ENEMY_X : PLAYER_X;
            this.tweens.add({
              targets: v.root,
              x: baseX + dir * 12,
              duration: 60,
              yoyo: true,
              ease: 'Quad.easeOut',
            });
            if (e.amount > STRONG_HIT) sfx.bigHit();
            else sfx.hit();
            if (e.who === 'player') {
              shake(this, true);
              screenFlash(this, PAL.perigo, 0.3);
            } else {
              shake(this, e.amount > STRONG_HIT);
              run.stats.damageDealt += e.amount;
            }
          } else {
            sfx.block();
          }
          this.refreshFighters();
          await this.wait(160);
          break;
        }
        case 'block': {
          const c = this.viewOf(e.who).center();
          floatText(this, c.x, c.y + 20, `+${e.amount} bloqueio`, PALS.jogador, 30);
          sfx.block();
          this.refreshFighters();
          pop(this, this.viewOf(e.who).blockIcon);
          await this.wait(110);
          break;
        }
        case 'status': {
          const c = this.viewOf(e.who).center();
          floatText(this, c.x, c.y - 90, e.label, e.good ? PALS.buff : PALS.inimigo, 30);
          if (e.good) sfx.buff();
          else sfx.debuff();
          this.refreshFighters();
          await this.wait(130);
          break;
        }
        case 'draw':
          sfx.draw();
          this.syncHand();
          this.refreshCounters();
          await this.wait(60 * e.count + 80);
          break;
        case 'shuffle':
          floatText(this, DRAW_PILE.x + 60, DRAW_PILE.y - 110, 'Reembaralhou!', PALS.ouro, 26);
          this.refreshCounters();
          await this.wait(200);
          break;
        case 'energy':
          floatText(this, 150, 470, `+${e.amount} energia`, PALS.ouro, 28);
          pop(this, this.energyOrb);
          this.refreshAll();
          break;
        case 'power': {
          const c = this.playerV.center();
          floatText(this, c.x, c.y - 110, `Poder: ${CARDS[e.card].name}`, PALS.poder, 28);
          sfx.buff();
          this.refreshAll();
          await this.wait(150);
          break;
        }
      }
    }
  }

  private burst(x: number, y: number, color: number, n: number): void {
    this.emitter.setParticleTint(color);
    this.emitter.explode(n, x, y);
  }

  // ------------------------------------------------------------ UI

  private updateCenter(): void {
    const isBoss = MAP_NODES[run.node]?.kind === 'boss';
    const label = isBoss ? 'CHEFE' : `Etapa ${run.node + 1}/${MAP_NODES.length}`;
    this.hud.center.setText(
      `${label} · ${ENEMIES[this.enemyId].name} · Turno ${Math.max(1, this.combat.turn)}`,
    );
  }

  private statusLine(f: Fighter): string {
    const s: string[] = [];
    const str = f.strength + f.tempStrength;
    if (str) s.push(`Força ${str}`);
    if (f.dexterity) s.push(`Destreza ${f.dexterity}`);
    if (f.vulnerable) s.push(`Vulnerável ${f.vulnerable}`);
    if (f.weak) s.push(`Fraco ${f.weak}`);
    return s.join(' · ');
  }

  private refreshFighters(): void {
    for (const who of ['player', 'enemy'] as const) {
      const v = this.viewOf(who);
      const f = who === 'player' ? this.combat.player : this.combat.enemy;
      v.bar.set(f.hp, f.maxHp, f.block);
      v.blockIcon.setVisible(f.block > 0);
      v.blockText.setText(f.block > 0 ? String(f.block) : '');
      v.status.setText(this.statusLine(f));
    }
    run.hp = this.combat.player.hp;
    this.hud.hp.set(run.hp, run.maxHp);
  }

  private refreshCounters(): void {
    this.drawCount.setText(String(this.combat.drawPile.length));
    this.discardCount.setText(String(this.combat.discard.length));
  }

  private refreshAll(): void {
    this.refreshFighters();
    this.refreshCounters();
    this.energyText.setText(`${this.combat.energy}/${PLAYER.energyPerTurn}`);
    const powers = this.combat.powers.map((id) => `• ${CARDS[id].name}`);
    this.powersText.setText(powers.length ? `Poderes ativos:\n${powers.join('\n')}` : '');
    this.endBtn.container.setAlpha(this.busy ? 0.6 : 1);
  }

  private showIntent(animate = true): void {
    this.intent.removeAll(true);
    const m = this.combat.currentMove;
    const parts: { icon: string; text: string }[] = [];
    const dmg = this.combat.intentDamage();
    if (dmg !== null)
      parts.push({
        icon: 'intent-attack',
        text: m.hits && m.hits > 1 ? `${dmg}×${m.hits}` : `${dmg}`,
      });
    if (m.block) parts.push({ icon: 'intent-defend', text: `${m.block}` });
    if (m.strength) parts.push({ icon: 'intent-buff', text: `+${m.strength}` });
    if (m.vulnerable || m.weak) {
      const d: string[] = [];
      if (m.vulnerable) d.push(`Vuln. ${m.vulnerable}`);
      if (m.weak) d.push(`Fraco ${m.weak}`);
      parts.push({ icon: 'intent-debuff', text: d.join(' ') });
    }
    const bg = this.add.graphics();
    this.intent.add(bg);
    const items: Phaser.GameObjects.Components.Transform[] = [];
    let x = 0;
    for (const p of parts) {
      const icon = this.add.image(x + 24, 0, p.icon);
      this.intent.add(icon);
      items.push(icon);
      x += 52;
      if (p.text) {
        const small = p.icon === 'intent-debuff';
        const t = this.add
          .text(x, 2, p.text, {
            fontFamily: small ? FONT_UI : FONT_TITLE,
            fontStyle: small ? '800' : 'normal',
            fontSize: small ? '20px' : '30px',
            color: PALS.branco,
            stroke: PALS.tinta,
            strokeThickness: 5,
          })
          .setOrigin(0, 0.5);
        this.intent.add(t);
        items.push(t);
        x += t.width + 10;
      }
      x += 8;
    }
    const total = x - 8;
    for (const it of items) it.x -= total / 2;
    bg.fillStyle(PAL.preto, 0.45).fillRoundedRect(-total / 2 - 10, -30, total + 20, 60, 12);
    const name = this.add
      .text(0, 44, m.name, {
        fontFamily: FONT_UI,
        fontStyle: '800',
        fontSize: '18px',
        color: PALS.pelePapel,
        stroke: PALS.tinta,
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.intent.add(name);
    if (animate) pop(this, this.intent);
  }
}
