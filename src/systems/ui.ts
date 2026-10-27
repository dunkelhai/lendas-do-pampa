import Phaser from 'phaser';
import { FONT_TITLE, FONT_UI, PAL, PALS } from '../style/palette';
import { pop } from './fx';
import { sfx } from './audio';

export function uiText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 22,
  color: string = PALS.branco,
  weight: '700' | '800' = '800',
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT_UI,
      fontStyle: weight,
      fontSize: `${size}px`,
      color,
      stroke: PALS.tinta,
      strokeThickness: 5,
      align: 'center',
    })
    .setOrigin(0.5);
}

export function titleText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: number,
  color: string = PALS.ouro,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT_TITLE,
      fontSize: `${size}px`,
      color,
      stroke: PALS.tinta,
      strokeThickness: 8,
    })
    .setOrigin(0.5)
    .setShadow(0, 3, '#000', 0, true, true);
}

export function panel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 0.45,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, alpha).fillRoundedRect(x, y, w, h, 12);
  return g;
}

export interface Button {
  container: Phaser.GameObjects.Container;
  setFocus: (on: boolean) => void;
  activate: () => void;
}

/** Botão 240×56 com pop e foco (mouse ou teclado). */
export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  w = 240,
  h = 56,
  color: number = PAL.jogador,
): Button {
  const bg = scene.add.graphics();
  const draw = (focus: boolean) => {
    bg.clear();
    bg.fillStyle(PAL.tinta, 1).fillRoundedRect(-w / 2 + 3, -h / 2 + 5, w, h, 14);
    bg.fillStyle(focus ? PAL.ouro : color, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(4, PAL.tinta, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
  };
  draw(false);
  const t = scene.add
    .text(0, 0, label, {
      fontFamily: FONT_UI,
      fontStyle: '800',
      fontSize: label.length > 16 ? '22px' : '26px',
      color: PALS.branco,
      stroke: PALS.tinta,
      strokeThickness: 5,
    })
    .setOrigin(0.5);
  const c = scene.add.container(x, y, [bg, t]).setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  let focused = false;
  const setFocus = (on: boolean) => {
    if (on && !focused) pop(scene, c);
    focused = on;
    draw(on);
  };
  const activate = () => {
    sfx.select();
    pop(scene, c);
    onClick();
  };
  c.on('pointerover', () => setFocus(true));
  c.on('pointerout', () => setFocus(false));
  c.on('pointerup', activate);
  return { container: c, setFocus, activate };
}

/** Barra de vida simples (redesenhar só quando muda). */
export class Bar {
  readonly g: Phaser.GameObjects.Graphics;
  readonly label: Phaser.GameObjects.Text;
  constructor(
    private scene: Phaser.Scene,
    private x: number,
    private y: number,
    private w: number,
    private h: number,
    private color: number,
  ) {
    this.g = scene.add.graphics();
    this.label = scene.add
      .text(x + w / 2, y + h / 2, '', {
        fontFamily: FONT_UI,
        fontStyle: '800',
        fontSize: '18px',
        color: PALS.branco,
        stroke: PALS.tinta,
        strokeThickness: 4,
      })
      .setOrigin(0.5);
  }

  set(value: number, max: number, block = 0): void {
    const g = this.g;
    const f = Math.max(0, Math.min(1, value / max));
    g.clear();
    g.fillStyle(PAL.tinta, 1).fillRoundedRect(this.x - 3, this.y - 3, this.w + 6, this.h + 6, 8);
    g.fillStyle(0x3a2a3a, 1).fillRoundedRect(this.x, this.y, this.w, this.h, 6);
    if (f > 0)
      g.fillStyle(block > 0 ? PAL.jogador : this.color, 1).fillRoundedRect(
        this.x,
        this.y,
        Math.max(12, this.w * f),
        this.h,
        6,
      );
    this.label.setText(`${value}/${max}`);
  }

  setDepth(d: number): this {
    this.g.setDepth(d);
    this.label.setDepth(d + 1);
    return this;
  }

  destroy(): void {
    this.g.destroy();
    this.label.destroy();
    void this.scene;
  }
}
