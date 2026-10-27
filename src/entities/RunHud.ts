import Phaser from 'phaser';
import { FONT_UI, PAL, PALS } from '../style/palette';
import { RELICS } from '../systems/relics';
import { run } from '../systems/run';
import { Bar, panel } from '../systems/ui';

/** Faixa superior: vida (esq.), contexto (centro), relíquias e baralho (dir.). */
export class RunHud {
  readonly hp: Bar;
  readonly center: Phaser.GameObjects.Text;
  readonly deckText: Phaser.GameObjects.Text;
  private tip: Phaser.GameObjects.Text;

  constructor(
    private scene: Phaser.Scene,
    centerText: string,
  ) {
    panel(scene, 16, 10, 300, 56).setDepth(500);
    scene.add
      .text(40, 38, 'VIDA', {
        fontFamily: FONT_UI,
        fontStyle: '800',
        fontSize: '20px',
        color: PALS.pelePapel,
      })
      .setOrigin(0, 0.5)
      .setDepth(501);
    this.hp = new Bar(scene, 104, 24, 196, 28, PAL.perigo).setDepth(501);
    this.hp.set(run.hp, run.maxHp);

    this.center = scene.add
      .text(640, 30, centerText, {
        fontFamily: FONT_UI,
        fontStyle: '800',
        fontSize: '24px',
        color: PALS.branco,
        stroke: PALS.tinta,
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(501);

    panel(scene, 1264 - 300, 10, 300, 56).setDepth(500);
    this.deckText = scene.add
      .text(1232, 38, '', {
        fontFamily: FONT_UI,
        fontStyle: '800',
        fontSize: '20px',
        color: PALS.pelePapel,
      })
      .setOrigin(1, 0.5)
      .setDepth(501);
    this.tip = scene.add
      .text(0, 0, '', {
        fontFamily: FONT_UI,
        fontStyle: '700',
        fontSize: '18px',
        color: PALS.tinta,
        backgroundColor: PALS.pelePapel,
        padding: { x: 10, y: 6 },
        wordWrap: { width: 300 },
      })
      .setDepth(950)
      .setVisible(false);
    this.refresh();
  }

  refresh(): void {
    this.hp.set(run.hp, run.maxHp);
    this.deckText.setText(`Baralho: ${run.deck.length}`);
    run.relics.forEach((id, i) => {
      const key = `relic-${id}`;
      const name = `relic-icon-${id}`;
      if (this.scene.children.getByName(name)) return;
      const icon = this.scene.add
        .image(1000 + i * 48, 38, key)
        .setName(name)
        .setDepth(501)
        .setInteractive();
      icon.on('pointerover', () => {
        this.tip
          .setText(`${RELICS[id].name}\n${RELICS[id].text}`)
          .setPosition(900, 74)
          .setVisible(true);
      });
      icon.on('pointerout', () => this.tip.setVisible(false));
    });
  }
}
