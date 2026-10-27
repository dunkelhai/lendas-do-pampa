import Phaser from 'phaser';
import { PAL } from '../style/palette';

type G = Phaser.GameObjects.Graphics;

/** Pincel de cartum: toda forma é cor chapada + contorno grosso `tinta`. */
export class Ink {
  constructor(
    readonly g: G,
    public lw = 4,
  ) {}

  private stroke(lw?: number): void {
    this.g.lineStyle(lw ?? this.lw, PAL.tinta, 1);
  }

  circle(x: number, y: number, r: number, fill: number, lw?: number): this {
    this.g.fillStyle(fill, 1).fillCircle(x, y, r);
    if ((lw ?? this.lw) > 0) {
      this.stroke(lw);
      this.g.strokeCircle(x, y, r);
    }
    return this;
  }

  ellipse(x: number, y: number, w: number, h: number, fill: number, lw?: number): this {
    this.g.fillStyle(fill, 1).fillEllipse(x, y, w, h);
    if ((lw ?? this.lw) > 0) {
      this.stroke(lw);
      this.g.strokeEllipse(x, y, w, h);
    }
    return this;
  }

  rect(x: number, y: number, w: number, h: number, fill: number, r = 0, lw?: number): this {
    if (r > 0) this.g.fillStyle(fill, 1).fillRoundedRect(x, y, w, h, r);
    else this.g.fillStyle(fill, 1).fillRect(x, y, w, h);
    if ((lw ?? this.lw) > 0) {
      this.stroke(lw);
      if (r > 0) this.g.strokeRoundedRect(x, y, w, h, r);
      else this.g.strokeRect(x, y, w, h);
    }
    return this;
  }

  /** Polígono a partir de [x0,y0,x1,y1,...]. */
  poly(pts: number[], fill: number, lw?: number): this {
    const v: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < pts.length; i += 2) v.push({ x: pts[i], y: pts[i + 1] });
    this.g.fillStyle(fill, 1).fillPoints(v, true);
    if ((lw ?? this.lw) > 0) {
      this.stroke(lw);
      this.g.strokePoints(v, true, true);
    }
    return this;
  }

  /** Preenchimento sem contorno (sombra chapada / detalhe). */
  shade(pts: number[], fill: number, alpha = 1): this {
    const v: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < pts.length; i += 2) v.push({ x: pts[i], y: pts[i + 1] });
    this.g.fillStyle(fill, alpha).fillPoints(v, true);
    return this;
  }

  /** Linha grossa com contorno (corda, perna, cabo). */
  line(pts: number[], color: number, width: number): this {
    const v: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < pts.length; i += 2) v.push({ x: pts[i], y: pts[i + 1] });
    this.g.lineStyle(width + 4, PAL.tinta, 1).strokePoints(v, false, false);
    this.g.lineStyle(width, color, 1).strokePoints(v, false, false);
    for (const p of [v[0], v[v.length - 1]]) {
      this.g.fillStyle(PAL.tinta, 1).fillCircle(p.x, p.y, width / 2 + 2);
      this.g.fillStyle(color, 1).fillCircle(p.x, p.y, width / 2);
    }
    return this;
  }

  /** Olho expressivo: branco + pupila + brilho. */
  eye(x: number, y: number, r: number, iris: number = PAL.tinta): this {
    this.circle(x, y, r, PAL.branco, 3);
    this.g.fillStyle(iris, 1).fillCircle(x + r * 0.15, y + r * 0.1, r * 0.55);
    this.g.fillStyle(PAL.branco, 1).fillCircle(x + r * 0.35, y - r * 0.2, r * 0.2);
    return this;
  }
}
