import Phaser from 'phaser';
import { ENEMIES, MAP_NODES, type MapNode } from '../config/balance';
import { PampaBackground, addVignette, stageForNode } from '../entities/PampaBackground';
import { RunHud } from '../entities/RunHud';
import { FONT_UI, PAL, PALS } from '../style/palette';
import { sfx } from '../systems/audio';
import { bindCommonKeys } from '../systems/flow';
import { goto } from '../systems/fx';
import { RELICS } from '../systems/relics';
import { run } from '../systems/run';
import { panel, titleText, uiText } from '../systems/ui';

const NODE_X = [200, 420, 640, 860, 1080];
const NODE_Y = [380, 330, 390, 330, 360];

function nodeLabel(n: MapNode): string {
  if (n.kind === 'event') return 'Evento';
  if (n.kind === 'boss') return 'Chefe';
  return 'Combate';
}

function nodeDesc(n: MapNode): string {
  if (n.kind === 'event') return 'Um galpão à beira da estrada. Alguém mantém o fogo aceso...';
  if (n.kind === 'boss')
    return `${ENEMIES[n.enemy].name}: a furna encantada desperta. Prepare o baralho!`;
  return `${ENEMIES[n.enemy].name} cruza o caminho.`;
}

export class MapScene extends Phaser.Scene {
  constructor() {
    super('Map');
  }

  create(): void {
    this.cameras.main.fadeIn(250);
    const node = Math.min(run.node, MAP_NODES.length - 1);
    new PampaBackground(this, stageForNode(node), stageForNode(Math.max(0, node - 1)));
    addVignette(this);
    new RunHud(this, 'O Caminho da Salamanca');

    titleText(this, 640, 130, 'MAPA DA JORNADA', 56, PALS.pelePapel);

    // estrada de terra pontilhada
    const road = this.add.graphics();
    for (let i = 0; i < NODE_X.length - 1; i++) {
      const steps = 10;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const x = Phaser.Math.Linear(NODE_X[i], NODE_X[i + 1], t);
        const y = Phaser.Math.Linear(NODE_Y[i], NODE_Y[i + 1], t) - Math.sin(t * Math.PI) * 24;
        const done = i < run.node;
        road.fillStyle(PAL.tinta, 1).fillCircle(x, y, 7);
        road.fillStyle(done ? PAL.ouro : PAL.pelePapel, 1).fillCircle(x, y, 5);
      }
    }

    MAP_NODES.forEach((n, i) => {
      const key =
        n.kind === 'event' ? 'node-event' : n.kind === 'boss' ? 'node-boss' : 'node-combat';
      const img = this.add.image(NODE_X[i], NODE_Y[i], key);
      const label = uiText(this, NODE_X[i], NODE_Y[i] + 66, `${i + 1}. ${nodeLabel(n)}`, 22);
      if (n.kind !== 'event') {
        uiText(this, NODE_X[i], NODE_Y[i] + 94, ENEMIES[n.enemy].name, 16, PALS.pelePapel, '700');
      }
      if (i < run.node) {
        img.setAlpha(0.55);
        label.setAlpha(0.6);
        this.add
          .text(NODE_X[i] + 26, NODE_Y[i] - 34, '✔', {
            fontFamily: FONT_UI,
            fontSize: '32px',
            color: PALS.buff,
            stroke: PALS.tinta,
            strokeThickness: 5,
          })
          .setOrigin(0.5);
      } else if (i === run.node) {
        const ring = this.add.circle(NODE_X[i], NODE_Y[i], 52).setStrokeStyle(6, PAL.ouro);
        this.tweens.add({
          targets: [img, ring],
          scale: 1.12,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        img.setInteractive({ useHandCursor: true }).on('pointerup', () => this.enter());
      }
    });

    // gaúcho no nó atual
    const px = NODE_X[node];
    const py = NODE_Y[node] - 70;
    const token = this.add.image(px, py, 'player').setOrigin(0.5, 1).setScale(0.32);
    this.tweens.add({
      targets: token,
      y: py - 10,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeOut',
    });

    // painel inferior
    panel(this, 160, 520, 960, 150, 0.55);
    uiText(this, 640, 556, nodeDesc(MAP_NODES[node]), 24, PALS.branco);
    const rel = run.relics.map((r) => `${RELICS[r].name} (${RELICS[r].text})`).join('  ·  ');
    uiText(this, 640, 596, `Relíquias: ${rel || 'nenhuma'}`, 18, PALS.ouro, '700');
    const go = uiText(
      this,
      640,
      640,
      'Espaço / Z ou clique no nó brilhante para seguir',
      22,
      PALS.pelePapel,
    );
    this.tweens.add({ targets: go, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });

    const kb = this.input.keyboard;
    kb?.on('keydown-SPACE', () => this.enter());
    kb?.on('keydown-Z', () => this.enter());
    kb?.on('keydown-ENTER', () => this.enter());
    bindCommonKeys(this);
  }

  private enter(): void {
    const n = MAP_NODES[run.node];
    if (!n) return;
    sfx.select();
    if (n.kind === 'event') goto(this, 'Event');
    else goto(this, 'Combat', { enemy: n.enemy });
  }
}
