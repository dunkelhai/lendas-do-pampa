import Phaser from 'phaser';
import { EVENT_CFG, type CardId } from '../config/balance';
import { cardKey } from '../entities/cardTexture';
import { PampaBackground, addVignette, stageForNode } from '../entities/PampaBackground';
import { RunHud } from '../entities/RunHud';
import { FONT_UI, PAL, PALS } from '../style/palette';
import { sfx } from '../systems/audio';
import { CARDS } from '../systems/cards';
import { bindCommonKeys } from '../systems/flow';
import { goto, pop } from '../systems/fx';
import { RELICS } from '../systems/relics';
import { heal, run } from '../systems/run';
import { button, panel, titleText, uiText, type Button } from '../systems/ui';

type Mode = 'choose' | 'remove' | 'done';

export class EventScene extends Phaser.Scene {
  private mode: Mode = 'choose';
  private hud!: RunHud;
  private optionButtons: Button[] = [];
  private focus = 0;
  private result!: Phaser.GameObjects.Text;
  private deckLayer?: Phaser.GameObjects.Container;
  private deckImgs: Phaser.GameObjects.Image[] = [];
  private details: string[] = [];

  constructor() {
    super('Event');
  }

  create(): void {
    this.mode = 'choose';
    this.focus = 0;
    this.optionButtons = [];
    this.cameras.main.fadeIn(250);
    new PampaBackground(this, stageForNode(run.node), stageForNode(run.node - 1));
    addVignette(this);
    this.hud = new RunHud(this, 'Evento');

    // galpão com fogo de chão
    const g = this.add.graphics();
    g.fillStyle(PAL.tinta, 1).fillRect(148, 236, 214, 154);
    g.fillStyle(PAL.madeira, 1).fillRect(152, 240, 206, 146);
    g.fillStyle(PAL.tinta, 1).fillTriangle(130, 246, 255, 150, 380, 246);
    g.fillStyle(PAL.poncho, 1).fillTriangle(140, 241, 255, 158, 370, 241);
    g.fillStyle(PAL.chapeu, 1).fillRect(230, 300, 50, 86);
    g.fillStyle(PAL.ouro, 1).fillRect(176, 270, 34, 28);
    const fire = this.add
      .image(300, 400, 'light')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(PAL.brasa)
      .setScale(1.4)
      .setAlpha(0.7);
    this.tweens.add({
      targets: fire,
      alpha: 0.4,
      scale: 1.25,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
    this.add.image(300, 400, 'node-event').setScale(0.9);

    panel(this, 440, 100, 800, 250, 0.55);
    titleText(this, 840, 140, 'O GALPÃO DO TROPEIRO', 44, PALS.ouro);
    this.add.text(
      470,
      180,
      'Na beira da estrada, um velho tropeiro mantém o fogo de chão aceso e a chaleira chiando. ' +
        '"Senta, vivente. Daqui pra frente a coxilha é braba. O que tu precisa pra seguir?"',
      {
        fontFamily: FONT_UI,
        fontStyle: '700',
        fontSize: '21px',
        color: PALS.pelePapel,
        wordWrap: { width: 740 },
        lineSpacing: 6,
      },
    );

    const relic = RELICS[run.eventRelic];
    const healAmt = Math.round(run.maxHp * EVENT_CFG.healPercent);
    const opts: { label: string; detail: string; act: () => void }[] = [
      {
        label: `Descansar no fogo de chão (+${healAmt} vida)`,
        detail: `Cure ${healAmt} de vida (você tem ${run.hp}/${run.maxHp}).`,
        act: () => this.doHeal(healAmt),
      },
      {
        label: `Aceitar o presente: ${relic.name}`,
        detail: `Relíquia: ${relic.text}`,
        act: () => this.doRelic(),
      },
      {
        label: 'Contar um causo e deixar uma carta',
        detail: 'Remova 1 carta do seu baralho à sua escolha.',
        act: () => this.openRemove(),
      },
    ];
    this.details = opts.map((o) => o.detail);
    opts.forEach((o, i) => {
      const b = button(
        this,
        840,
        400 + i * 72,
        o.label,
        () => this.mode === 'choose' && o.act(),
        780,
        58,
        PAL.inimigo,
      );
      b.container.on('pointerover', () => this.setFocus(i));
      this.optionButtons.push(b);
    });
    this.result = uiText(this, 840, 640, '', 22, PALS.ouro).setDepth(60);
    this.setFocus(0);

    const kb = this.input.keyboard;
    const up = () => this.move(-1);
    const down = () => this.move(1);
    kb?.on('keydown-UP', up);
    kb?.on('keydown-W', up);
    kb?.on('keydown-DOWN', down);
    kb?.on('keydown-S', down);
    kb?.on('keydown-LEFT', up);
    kb?.on('keydown-RIGHT', down);
    kb?.on('keydown-A', up);
    kb?.on('keydown-D', down);
    const ok = () => this.confirm();
    kb?.on('keydown-Z', ok);
    kb?.on('keydown-SPACE', ok);
    kb?.on('keydown-ENTER', ok);
    kb?.on('keydown-X', () => this.mode === 'remove' && this.closeRemove());
    bindCommonKeys(this);
  }

  private move(d: number): void {
    if (this.mode === 'choose') {
      this.setFocus((this.focus + d + 3) % 3);
    } else if (this.mode === 'remove') {
      const n = this.deckImgs.length;
      this.setFocus((this.focus + d + n) % n);
    }
  }

  private setFocus(i: number): void {
    this.focus = i;
    if (this.mode === 'choose') {
      this.optionButtons.forEach((b, k) => b.setFocus(k === i));
      this.result.setText(this.details[i] ?? '');
    } else if (this.mode === 'remove') {
      this.deckImgs.forEach((img, k) => {
        img.setScale(k === i ? 0.7 : 0.55).setDepth(k === i ? 10 : 1);
      });
    }
  }

  private confirm(): void {
    if (this.mode === 'choose') this.optionButtons[this.focus].activate();
    else if (this.mode === 'remove') this.removeCard(this.focus);
    else this.leave();
  }

  private finish(msg: string): void {
    this.mode = 'done';
    this.optionButtons.forEach((b) => b.container.setAlpha(0.4).disableInteractive());
    this.result.setText(`${msg}  ·  Espaço / Z para seguir`);
    pop(this, this.result);
    this.time.delayedCall(200, () => this.input.once('pointerup', () => this.leave()));
  }

  private leave(): void {
    if (this.mode !== 'done') return;
    run.node += 1;
    goto(this, 'Map');
  }

  private doHeal(amount: number): void {
    const got = heal(amount);
    sfx.buff();
    this.hud.refresh();
    pop(this, this.hud.hp.label);
    this.finish(`O mate quente e o fogo te recompõem: +${got} de vida.`);
  }

  private doRelic(): void {
    const id = run.eventRelic;
    if (!run.relics.includes(id)) run.relics.push(id);
    sfx.buff();
    this.hud.refresh();
    this.finish(`Você ganhou: ${RELICS[id].name}!`);
  }

  private openRemove(): void {
    this.mode = 'remove';
    this.focus = 0;
    const layer = this.add.container(0, 0).setDepth(50);
    this.deckLayer = layer;
    layer.add(this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.75).setInteractive());
    layer.add(uiText(this, 640, 100, 'Qual carta fica no galpão? (X para voltar)', 28, PALS.ouro));
    const perRow = 8;
    const ids: CardId[] = [...run.deck];
    this.deckImgs = ids.map((id, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const inRow = Math.min(perRow, ids.length - row * perRow);
      const x = 640 + (col - (inRow - 1) / 2) * 118;
      const y = 250 + row * 170;
      const img = this.add
        .image(x, y, cardKey(id))
        .setScale(0.55)
        .setInteractive({ useHandCursor: true });
      img.on('pointerover', () => this.setFocus(i));
      img.on('pointerup', () => this.removeCard(i));
      layer.add(img);
      return img;
    });
    this.setFocus(0);
  }

  private closeRemove(): void {
    this.deckLayer?.destroy();
    this.deckLayer = undefined;
    this.deckImgs = [];
    this.mode = 'choose';
    this.setFocus(2);
  }

  private removeCard(i: number): void {
    if (this.mode !== 'remove') return;
    const id = run.deck[i];
    if (!id) return;
    run.deck.splice(i, 1);
    sfx.debuff();
    this.deckLayer?.destroy();
    this.deckLayer = undefined;
    this.deckImgs = [];
    this.hud.refresh();
    this.finish(`"${CARDS[id].name}" ficou para trás. Baralho mais enxuto!`);
  }
}
