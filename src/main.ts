import Phaser from 'phaser';
import { PALS } from './style/palette';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { MapScene } from './scenes/MapScene';
import { CombatScene } from './scenes/CombatScene';
import { RewardScene } from './scenes/RewardScene';
import { EventScene } from './scenes/EventScene';
import { EndScene } from './scenes/EndScene';
import { PauseScene } from './scenes/PauseScene';

async function loadFonts(): Promise<void> {
  const wanted = ['32px Bangers', '700 16px Nunito', '800 16px Nunito'];
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
  await Promise.race([
    Promise.all(wanted.map((f) => document.fonts.load(f))).then(() => undefined),
    timeout,
  ]);
  await document.fonts.ready;
}

async function boot(): Promise<void> {
  await loadFonts();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    backgroundColor: PALS.tinta,
    antialias: true,
    roundPixels: true,
    fps: { target: 60 },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [
      BootScene,
      TitleScene,
      MapScene,
      CombatScene,
      RewardScene,
      EventScene,
      EndScene,
      PauseScene,
    ],
  });
  (window as unknown as { __game: Phaser.Game }).__game = game;
}

void boot();
