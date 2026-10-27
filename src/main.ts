import Phaser from 'phaser';

async function boot(): Promise<void> {
  await document.fonts.ready;
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    backgroundColor: '#2b3f7a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [],
  });
  (window as unknown as { __game: Phaser.Game }).__game = game;
}

void boot();
