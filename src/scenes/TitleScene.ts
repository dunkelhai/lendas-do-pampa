import Phaser from 'phaser';
import { PampaBackground, addVignette } from '../entities/PampaBackground';
import { FONT_UI, PALS } from '../style/palette';
import { initAudio, sfx } from '../systems/audio';
import { goto } from '../systems/fx';
import { newRun } from '../systems/run';
import { isDebug } from '../systems/settings';
import { panel, titleText, uiText } from '../systems/ui';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    this.cameras.main.fadeIn(250);
    new PampaBackground(this, 'tarde');
    addVignette(this);

    // decoração: gaúcho e criaturas no horizonte
    this.add.image(170, 470, 'player').setOrigin(0.5, 1).setScale(0.75);
    const sal = this.add
      .image(1110, 470, 'enemy-salamanca')
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setAlpha(0.95);
    this.tweens.add({
      targets: sal,
      scaleY: 0.515,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const title = titleText(this, 640, 220, 'LENDAS DO PAMPA', 104);
    title.setScale(0.6);
    this.tweens.add({ targets: title, scale: 1, duration: 300, ease: 'Back.easeOut' });
    uiText(this, 640, 300, 'Cartas, causos e assombrações da coxilha', 26, PALS.pelePapel);

    const press = uiText(this, 640, 400, 'Pressione ESPAÇO para começar', 32, PALS.branco);
    this.tweens.add({ targets: press, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });

    panel(this, 300, 440, 680, 170, 0.5);
    const lines = [
      'Mouse: arraste a carta até o inimigo (ataque) ou para cima (demais)',
      '← / → selecionar carta   ·   Z / Espaço jogar carta',
      'X / Shift / E encerrar turno   ·   Esc pausa   ·   R reiniciar run',
      'Vença 3 combates, 1 evento e o chefe: a Salamanca do Jarau',
    ];
    lines.forEach((l, i) => {
      this.add
        .text(640, 466 + i * 36, l, {
          fontFamily: FONT_UI,
          fontStyle: '700',
          fontSize: '20px',
          color: PALS.pelePapel,
        })
        .setOrigin(0.5, 0);
    });
    this.add
      .text(640, 690, `v0.1 · arte gerada por código${isDebug ? ' · DEBUG' : ''}`, {
        fontFamily: FONT_UI,
        fontStyle: '700',
        fontSize: '16px',
        color: PALS.branco,
      })
      .setOrigin(0.5)
      .setAlpha(0.5)
      .setDepth(10);

    const start = () => {
      initAudio();
      sfx.turn();
      newRun();
      goto(this, 'Map');
    };
    this.input.keyboard?.on('keydown-SPACE', start);
    this.input.keyboard?.on('keydown-Z', start);
    this.input.keyboard?.on('keydown-ENTER', start);
    this.input.on('pointerup', start);
  }
}
