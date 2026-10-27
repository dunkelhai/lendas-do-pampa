import Phaser from 'phaser';
import { PAL } from '../style/palette';

export type SkyStage = 'tarde' | 'crepusculo' | 'noite';

const SKIES: Record<SkyStage, [number, number, number]> = {
  tarde: [PAL.ceuAlto, PAL.ceuMedio, PAL.ceuBaixo],
  crepusculo: [PAL.crepAlto, PAL.crepMedio, PAL.crepBaixo],
  noite: [PAL.noiteAlto, PAL.noiteMedio, PAL.noiteBaixo],
};

export function stageForNode(node: number): SkyStage {
  if (node <= 1) return 'tarde';
  if (node <= 3) return 'crepusculo';
  return 'noite';
}

function lerpColor(a: number, b: number, t: number): number {
  const ca = Phaser.Display.Color.IntegerToColor(a);
  const cb = Phaser.Display.Color.IntegerToColor(b);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
}

function hillTexture(
  scene: Phaser.Scene,
  key: string,
  color: number,
  amp: number,
  freq: number,
  phase: number,
  base: number,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const pts: Phaser.Types.Math.Vector2Like[] = [{ x: 0, y: 440 }];
  for (let x = 0; x <= 1280; x += 16) {
    pts.push({
      x,
      y: base + amp * Math.sin(x * freq + phase) + amp * 0.4 * Math.sin(x * freq * 2.3 + phase * 2),
    });
  }
  pts.push({ x: 1280, y: 440 });
  g.fillStyle(color, 1).fillPoints(pts, true);
  // tufos de capim chapados
  g.fillStyle(PAL.tinta, 0.12);
  for (let i = 0; i < 40; i++) {
    const x = (i * 137) % 1280;
    const y = base + amp * Math.sin(x * freq + phase) + 30 + ((i * 53) % 120);
    g.fillTriangle(x, y, x + 4, y - 14, x + 8, y);
  }
  g.generateTexture(key, 1280, 440);
  g.destroy();
}

/** Céu do pampa em degradê (redesenhado a cada 2 s), nuvens e coxilhas. */
export class PampaBackground {
  private rt: Phaser.GameObjects.RenderTexture;
  private g: Phaser.GameObjects.Graphics;
  private cur: [number, number, number];
  private target: [number, number, number];
  private clouds: { img: Phaser.GameObjects.Image; speed: number }[] = [];
  private tick = 0;

  constructor(scene: Phaser.Scene, stage: SkyStage, from?: SkyStage) {
    this.target = [...SKIES[stage]];
    this.cur = [...SKIES[from ?? stage]];
    this.rt = scene.add.renderTexture(0, 0, 1280, 480).setOrigin(0).setDepth(-100);
    this.g = scene.make.graphics({ x: 0, y: 0 }, false);
    this.redraw();
    scene.time.addEvent({ delay: 2000, loop: true, callback: () => this.step() });

    for (let i = 0; i < 4; i++) {
      const img = scene.add
        .image(i * 340 + 80, 60 + (i % 2) * 70 + i * 12, 'cloud')
        .setAlpha(0.7)
        .setScale(0.7 + (i % 3) * 0.2)
        .setDepth(-90);
      if (stage !== 'tarde') img.setTint(stage === 'noite' ? PAL.noiteBaixo : PAL.crepBaixo);
      this.clouds.push({ img, speed: 0.1 + i * 0.06 });
    }
    hillTexture(scene, 'hills-back', PAL.coxilhaSombra, 35, 0.006, 0.8, 70);
    hillTexture(scene, 'hills-front', PAL.coxilha, 20, 0.009, 2.1, 110);
    const night =
      stage === 'noite' ? PAL.noiteBaixo : stage === 'crepusculo' ? PAL.crepBaixo : PAL.branco;
    scene.add.image(0, 290, 'hills-back').setOrigin(0).setDepth(-80).setTint(night);
    scene.add
      .image(0, 320, 'hills-front')
      .setOrigin(0)
      .setDepth(-70)
      .setTint(stage === 'tarde' ? PAL.branco : lerpColor(PAL.branco, night, 0.5));
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
      this.g.destroy();
    });
  }

  private step(): void {
    this.tick += 1;
    for (let i = 0; i < 3; i++) this.cur[i] = lerpColor(this.cur[i], this.target[i], 0.35);
    this.redraw();
  }

  private redraw(): void {
    // leve "respiração" do pôr do sol para o céu nunca ficar parado
    const wobble = (Math.sin(this.tick * 0.9) + 1) * 0.06;
    const [top, mid0, bot] = this.cur;
    const mid = lerpColor(mid0, bot, wobble);
    const g = this.g;
    g.clear();
    g.fillGradientStyle(top, top, mid, mid, 1).fillRect(0, 0, 1280, 300);
    g.fillGradientStyle(mid, mid, bot, bot, 1).fillRect(0, 300, 1280, 180);
    g.fillStyle(PAL.ouroClaro, 0.18).fillCircle(980, 330, 90);
    g.fillStyle(PAL.ouroClaro, 0.9).fillCircle(980, 330, 46);
    this.rt.clear().draw(g, 0, 0);
  }

  private update(): void {
    for (const c of this.clouds) {
      c.img.x += c.speed;
      if (c.img.x - c.img.displayWidth / 2 > 1280) c.img.x = -c.img.displayWidth / 2;
    }
  }
}

export function addVignette(scene: Phaser.Scene): void {
  if (scene.renderer.type === Phaser.WEBGL) {
    scene.cameras.main.postFX.addVignette(0.5, 0.5, 0.88, 0.25);
  }
}
