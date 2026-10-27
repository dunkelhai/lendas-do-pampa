import Phaser from 'phaser';
import { FONT_TITLE, PAL, PALS } from '../style/palette';
import { settings } from './settings';

export function shake(scene: Phaser.Scene, strong = false): void {
  if (settings.reduceMotion) return;
  if (strong) scene.cameras.main.shake(180, 0.007);
  else scene.cameras.main.shake(90, 0.003);
}

/** Flash de tela cheia (alpha limitado a 0.3 com "reduzir flash"). */
export function screenFlash(scene: Phaser.Scene, color: number, alpha = 0.45): void {
  const a = settings.reduceMotion ? Math.min(alpha, 0.3) : alpha;
  const r = scene.add.rectangle(640, 360, 1280, 720, color, a).setDepth(900);
  scene.tweens.add({ targets: r, alpha: 0, duration: 220, onComplete: () => r.destroy() });
}

export function hitFlash(scene: Phaser.Scene, img: Phaser.GameObjects.Image): void {
  img.setTintFill(PAL.branco);
  scene.time.delayedCall(80, () => img.clearTint());
}

export function pop(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Components.Transform,
  base = 1,
): void {
  scene.tweens.add({
    targets: target,
    scaleX: base * 1.1,
    scaleY: base * 1.1,
    duration: 70,
    ease: 'Quad.easeOut',
    yoyo: true,
    onComplete: () => (target as unknown as { setScale: (s: number) => void }).setScale(base),
  });
}

/** Número/texto flutuante: sobe 40 px em 600 ms e some. */
export function floatText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string,
  size = 40,
): void {
  const t = scene.add
    .text(x, y, text, {
      fontFamily: FONT_TITLE,
      fontSize: `${size}px`,
      color,
      stroke: PALS.tinta,
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setDepth(800);
  scene.tweens.add({
    targets: t,
    y: y - 40,
    alpha: 0,
    duration: 600,
    delay: 150,
    ease: 'Cubic.easeOut',
    onComplete: () => t.destroy(),
  });
  t.setScale(0.6);
  scene.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.easeOut' });
}

/** Transição padrão de cena. */
export function goto(scene: Phaser.Scene, key: string, data?: object): void {
  const cam = scene.cameras.main;
  if (cam.fadeEffect.isRunning && cam.fadeEffect.direction) return;
  cam.fade(250, 0, 0, 0, true);
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start(key, data);
  });
}
