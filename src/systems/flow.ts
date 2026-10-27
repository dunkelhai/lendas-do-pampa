import Phaser from 'phaser';
import { PALS } from '../style/palette';
import { newRun } from './run';
import { isDebug } from './settings';

const GAME_SCENES = ['Map', 'Combat', 'Reward', 'Event', 'End', 'Pause'];

/** Reinicia a run do zero e volta ao mapa. */
export function restartRun(from: Phaser.Scene): void {
  newRun();
  const mgr = from.scene.manager;
  for (const k of GAME_SCENES) {
    if (k === from.scene.key) continue;
    if (mgr.isActive(k) || mgr.isPaused(k) || mgr.isSleeping(k)) mgr.stop(k);
  }
  from.scene.start('Map');
}

/** Congela a cena atual e abre a tela de vitória/derrota por cima. */
export function showEnd(from: Phaser.Scene, win: boolean): void {
  if (from.scene.isActive('End')) return;
  from.scene.pause();
  from.scene.launch('End', { win, from: from.scene.key });
}

export function openPause(from: Phaser.Scene): void {
  if (from.scene.isActive('Pause')) return;
  from.scene.pause();
  from.scene.launch('Pause', { from: from.scene.key });
}

/** Esc = pausa, R = reiniciar run; com ?debug=1, F1 vitória e F2 derrota. */
export function bindCommonKeys(scene: Phaser.Scene): void {
  const kb = scene.input.keyboard;
  if (!kb) return;
  kb.on('keydown-ESC', () => openPause(scene));
  kb.on('keydown-R', () => restartRun(scene));
  if (isDebug) {
    kb.addKey('F1', true);
    kb.addKey('F2', true);
    kb.on('keydown-F1', () => showEnd(scene, true));
    kb.on('keydown-F2', () => showEnd(scene, false));
    kb.addKey('F6', true);
    let fps: Phaser.GameObjects.Text | null = null;
    kb.on('keydown-F6', () => {
      if (fps) {
        fps.destroy();
        fps = null;
        return;
      }
      const t = scene.add
        .text(1272, 712, '', { fontFamily: 'monospace', fontSize: '16px', color: PALS.branco })
        .setOrigin(1, 1)
        .setDepth(2000);
      fps = t;
      const ev = scene.time.addEvent({
        delay: 500,
        loop: true,
        callback: () =>
          t.active ? t.setText(`${scene.game.loop.actualFps.toFixed(0)} fps`) : ev.remove(),
      });
    });
  }
}
