import Phaser from 'phaser';
import { BASIC_CARDS, REWARD, type CardId } from '../config/balance';
import { cardKey } from '../entities/cardTexture';
import { PampaBackground, addVignette, stageForNode } from '../entities/PampaBackground';
import { RunHud } from '../entities/RunHud';
import { PAL, PALS } from '../style/palette';
import { sfx } from '../systems/audio';
import { ALL_CARD_IDS, CARDS } from '../systems/cards';
import { bindCommonKeys } from '../systems/flow';
import { goto, pop } from '../systems/fx';
import { run } from '../systems/run';
import { button, titleText, uiText } from '../systems/ui';

/** Sorteia N cartas distintas do pool, ponderadas por raridade. */
export function rollRewards(n: number): CardId[] {
  const pool = ALL_CARD_IDS.filter((id) => !BASIC_CARDS.includes(id));
  const out: CardId[] = [];
  while (out.length < n && out.length < pool.length) {
    const avail = pool.filter((id) => !out.includes(id));
    const total = avail.reduce((a, id) => a + REWARD.rarityWeight[CARDS[id].rarity], 0);
    let r = Math.random() * total;
    for (const id of avail) {
      r -= REWARD.rarityWeight[CARDS[id].rarity];
      if (r <= 0) {
        out.push(id);
        break;
      }
    }
  }
  return out;
}

export class RewardScene extends Phaser.Scene {
  private done = false;

  constructor() {
    super('Reward');
  }

  create(): void {
    this.done = false;
    this.cameras.main.fadeIn(250);
    new PampaBackground(this, stageForNode(Math.max(0, run.node - 1)));
    addVignette(this);
    this.add.rectangle(640, 360, 1280, 720, PAL.tinta, 0.35);
    const hud = new RunHud(this, 'Recompensa');
    titleText(this, 640, 120, 'ESCOLHA UMA CARTA', 56, PALS.ouro);
    uiText(
      this,
      640,
      172,
      'Ela entra no seu baralho para o resto da jornada.',
      20,
      PALS.pelePapel,
      '700',
    );

    const ids = rollRewards(REWARD.choices);
    const xs = [390, 640, 890];
    const imgs = ids.map((id, i) => {
      const img = this.add
        .image(xs[i], 380, cardKey(id))
        .setScale(0)
        .setInteractive({ useHandCursor: true });
      this.tweens.add({
        targets: img,
        scale: 1.2,
        duration: 300,
        delay: i * 90,
        ease: 'Back.easeOut',
      });
      uiText(
        this,
        xs[i],
        556,
        CARDS[id].rarity.toUpperCase(),
        16,
        CARDS[id].rarity === 'rara' ? PALS.ouro : PALS.pelePapel,
      );
      img.on('pointerover', () => setFocus(i));
      img.on('pointerup', () => pick(i));
      return img;
    });
    if (ids.some((id) => CARDS[id].rarity === 'rara') && this.renderer.type === Phaser.WEBGL) {
      const i = ids.findIndex((id) => CARDS[id].rarity === 'rara');
      imgs[i].preFX?.addGlow(PAL.ouro, 3, 0);
    }

    let focus = -1;
    const skipBtn = button(this, 640, 630, 'Pular (X)', () => skip(), 240);
    const setFocus = (i: number) => {
      if (focus === i) return;
      focus = i;
      sfx.select();
      imgs.forEach((img, k) => {
        this.tweens.add({
          targets: img,
          scale: k === i ? 1.32 : 1.2,
          y: k === i ? 364 : 380,
          duration: 140,
          ease: 'Quad.easeOut',
        });
      });
    };
    const finish = () => {
      this.time.delayedCall(450, () => goto(this, 'Map'));
    };
    const pick = (i: number) => {
      if (this.done || i < 0) return;
      this.done = true;
      run.deck.push(ids[i]);
      sfx.buff();
      const img = imgs[i];
      img.setDepth(10);
      this.tweens.add({
        targets: img,
        x: 1150,
        y: 38,
        scale: 0.15,
        duration: 420,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          hud.refresh();
          pop(this, hud.deckText);
        },
      });
      imgs.forEach((o, k) => k !== i && this.tweens.add({ targets: o, alpha: 0, duration: 200 }));
      finish();
    };
    const skip = () => {
      if (this.done) return;
      this.done = true;
      finish();
    };
    const kb = this.input.keyboard;
    kb?.on('keydown-LEFT', () => setFocus(focus <= 0 ? ids.length - 1 : focus - 1));
    kb?.on('keydown-RIGHT', () => setFocus(focus < 0 ? 0 : (focus + 1) % ids.length));
    kb?.on('keydown-A', () => setFocus(focus <= 0 ? ids.length - 1 : focus - 1));
    kb?.on('keydown-D', () => setFocus(focus < 0 ? 0 : (focus + 1) % ids.length));
    const confirm = () => (focus < 0 ? setFocus(1) : pick(focus));
    kb?.on('keydown-Z', confirm);
    kb?.on('keydown-SPACE', confirm);
    kb?.on('keydown-ENTER', confirm);
    kb?.on('keydown-X', () => skipBtn.activate());
    kb?.on('keydown-SHIFT', () => skipBtn.activate());
    uiText(
      this,
      640,
      690,
      '←/→ escolher · Z/Espaço pegar · X pular',
      16,
      PALS.pelePapel,
      '700',
    ).setAlpha(0.8);
    bindCommonKeys(this);
  }
}
