import Phaser from 'phaser';
import { PAL, PALS } from '../style/palette';
import { restartRun } from '../systems/flow';
import { settings } from '../systems/settings';
import { button, titleText, uiText, type Button } from '../systems/ui';

export class PauseScene extends Phaser.Scene {
  private from = '';

  constructor() {
    super('Pause');
  }

  init(data: { from: string }): void {
    this.from = data.from;
  }

  create(): void {
    this.add.rectangle(640, 360, 1280, 720, PAL.preto, 0.6);
    titleText(this, 640, 200, 'PAUSA', 64, PALS.ouro);
    const label = () => `Reduzir tremor/flash: ${settings.reduceMotion ? 'SIM' : 'NÃO'}`;
    const resume = () => {
      this.scene.resume(this.from);
      this.scene.stop();
    };
    const buttons: Button[] = [];
    buttons.push(button(this, 640, 320, 'Continuar', resume, 380));
    const motion = button(
      this,
      640,
      400,
      label(),
      () => {
        settings.reduceMotion = !settings.reduceMotion;
        (motion.container.list[1] as Phaser.GameObjects.Text).setText(label());
      },
      380,
    );
    buttons.push(motion);
    buttons.push(button(this, 640, 480, 'Reiniciar run (R)', () => restartRun(this), 380));
    uiText(
      this,
      640,
      580,
      '↑/↓ escolher · Z/Espaço confirmar · Esc voltar',
      20,
      PALS.pelePapel,
      '700',
    );

    let focus = 0;
    const refocus = () => buttons.forEach((b, i) => b.setFocus(i === focus));
    refocus();
    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => {
      focus = (focus + buttons.length - 1) % buttons.length;
      refocus();
    });
    kb?.on('keydown-DOWN', () => {
      focus = (focus + 1) % buttons.length;
      refocus();
    });
    kb?.on('keydown-W', () => {
      focus = (focus + buttons.length - 1) % buttons.length;
      refocus();
    });
    kb?.on('keydown-S', () => {
      focus = (focus + 1) % buttons.length;
      refocus();
    });
    kb?.on('keydown-Z', () => buttons[focus].activate());
    kb?.on('keydown-SPACE', () => buttons[focus].activate());
    kb?.on('keydown-ENTER', () => buttons[focus].activate());
    kb?.on('keydown-ESC', resume);
    kb?.on('keydown-R', () => restartRun(this));
  }
}
