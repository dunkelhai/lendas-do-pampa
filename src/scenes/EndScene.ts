import Phaser from 'phaser';
import { MAP_NODES } from '../config/balance';
import { PAL, PALS } from '../style/palette';
import { sfx } from '../systems/audio';
import { restartRun } from '../systems/flow';
import { elapsedText, run } from '../systems/run';
import { button, titleText, uiText, type Button } from '../systems/ui';

export class EndScene extends Phaser.Scene {
  private win = false;
  private from = '';

  constructor() {
    super('End');
  }

  init(data: { win: boolean; from: string }): void {
    this.win = data.win;
    this.from = data.from;
  }

  create(): void {
    this.add.rectangle(640, 360, 1280, 720, PAL.preto, 0.6);
    if (this.win) sfx.win();
    else sfx.lose();
    const title = titleText(
      this,
      640,
      260,
      this.win ? 'VITÓRIA!' : 'DERROTA',
      64,
      this.win ? PALS.ouro : PALS.perigo,
    );
    title.setScale(0.6);
    this.tweens.add({ targets: title, scale: 1, duration: 300, ease: 'Back.easeOut' });
    uiText(
      this,
      640,
      320,
      this.win
        ? 'A Salamanca do Jarau se aquietou. O pampa dorme em paz.'
        : 'O gaúcho tombou na coxilha... mas todo causo pode ser recontado.',
      22,
      PALS.pelePapel,
    );
    const cleared = this.win ? MAP_NODES.length : run.node;
    const stats = [
      `Etapas vencidas: ${cleared}/${MAP_NODES.length}`,
      `Turnos: ${run.stats.turns}   ·   Cartas jogadas: ${run.stats.cardsPlayed}   ·   Dano causado: ${run.stats.damageDealt}`,
      `Cartas no baralho: ${run.deck.length}   ·   Tempo: ${elapsedText()}`,
    ];
    stats.forEach((s, i) => uiText(this, 640, 380 + i * 40, s, 22, PALS.branco, '700'));

    const again = () => restartRun(this);
    const menu = () => {
      this.scene.stop(this.from);
      this.scene.start('Title');
    };
    const buttons: Button[] = [
      button(this, 640 - 136, 560, 'Tentar de novo', again),
      button(this, 640 + 136, 560, 'Menu', menu, 240, 56, PAL.inimigo),
    ];
    uiText(this, 640, 630, 'Espaço ou R: nova run', 20, PALS.pelePapel, '700');
    let focus = 0;
    const refocus = () => buttons.forEach((b, i) => b.setFocus(i === focus));
    refocus();
    const kb = this.input.keyboard;
    kb?.on('keydown-LEFT', () => {
      focus = 0;
      refocus();
    });
    kb?.on('keydown-RIGHT', () => {
      focus = 1;
      refocus();
    });
    kb?.on('keydown-SPACE', again);
    kb?.on('keydown-R', again);
    kb?.on('keydown-Z', () => buttons[focus].activate());
    kb?.on('keydown-ENTER', () => buttons[focus].activate());
  }
}
