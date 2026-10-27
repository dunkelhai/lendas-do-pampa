import Phaser from 'phaser';
import { PAL } from '../style/palette';
import { Ink } from './ink';
import type { ArtKind } from './cards';

type G = Phaser.GameObjects.Graphics;

/** Pontos de luz (ADD) de cada criatura, relativos ao canto superior esquerdo da textura. */
export interface LightSpot {
  x: number;
  y: number;
  color: number;
  scale: number;
}

export interface EnemyArt {
  key: string;
  w: number;
  h: number;
  lights: LightSpot[];
}

export const ENEMY_ART: Record<'negrinho' | 'lobisomem' | 'teiniagua' | 'salamanca', EnemyArt> = {
  negrinho: {
    key: 'enemy-negrinho',
    w: 330,
    h: 300,
    lights: [{ x: 113, y: 70, color: PAL.ouro, scale: 0.9 }],
  },
  lobisomem: { key: 'enemy-lobisomem', w: 300, h: 330, lights: [] },
  teiniagua: {
    key: 'enemy-teiniagua',
    w: 360,
    h: 240,
    lights: [{ x: 66, y: 104, color: PAL.carbunculo, scale: 0.8 }],
  },
  salamanca: {
    key: 'enemy-salamanca',
    w: 460,
    h: 420,
    lights: [
      { x: 165, y: 218, color: PAL.brasa, scale: 1 },
      { x: 299, y: 218, color: PAL.brasa, scale: 1 },
      { x: 48, y: 302, color: PAL.carbunculo, scale: 0.6 },
    ],
  },
};

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Amostra uma curva em pontos [x,y,...]. */
function curve(n: number, f: (t: number) => [number, number]): number[] {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(...f(i / n));
  return out;
}

// ---------------------------------------------------------------- criaturas

function drawNegrinho(g: G): void {
  const k = new Ink(g, 4);
  // cauda
  k.poly([262, 150, 300, 168, 318, 236, 298, 248, 280, 192], PAL.chapeu);
  // pernas
  k.rect(236, 200, 20, 84, PAL.baioSombra, 6);
  k.rect(96, 205, 20, 80, PAL.baioSombra, 6);
  k.rect(206, 205, 20, 82, PAL.baio, 6);
  k.rect(126, 200, 20, 86, PAL.baio, 6);
  for (const x of [96, 126, 206, 236]) g.fillStyle(PAL.tinta, 1).fillRect(x - 2, 280, 24, 12);
  // corpo
  k.ellipse(180, 185, 200, 95, PAL.baio);
  k.shade([86, 197, 274, 197, 232, 226, 128, 226], PAL.baioSombra);
  g.lineStyle(4, PAL.tinta, 1).strokeEllipse(180, 185, 200, 95);
  // pescoço e cabeça
  k.poly([100, 172, 70, 95, 105, 85, 138, 160], PAL.baio);
  k.poly([76, 84, 82, 58, 94, 84], PAL.baio, 3);
  k.poly([70, 80, 40, 95, 22, 140, 38, 152, 62, 140, 100, 100], PAL.baio);
  k.poly([72, 88, 102, 80, 134, 150, 118, 152], PAL.chapeu, 3);
  g.fillStyle(PAL.tinta, 1).fillCircle(62, 102, 5).fillCircle(32, 140, 3);
  // manta da sela
  k.rect(150, 140, 74, 30, PAL.poncho, 6);
  // menino
  k.line([182, 150, 172, 205, 162, 210], PAL.camisaSombra, 12);
  k.rect(150, 95, 50, 62, PAL.camisa, 12);
  k.shade([178, 99, 196, 99, 196, 153, 178, 153], PAL.camisaSombra);
  g.lineStyle(4, PAL.tinta, 1).strokeRoundedRect(150, 95, 50, 62, 12);
  k.line([160, 116, 124, 112], PAL.pele, 10);
  // vela
  k.rect(108, 84, 10, 28, PAL.pelePapel, 2, 3);
  k.poly([113, 58, 105, 76, 113, 86, 121, 76], PAL.ouro, 3);
  g.fillStyle(PAL.ouroClaro, 1).fillEllipse(113, 76, 6, 10);
  // cabeça do menino
  k.circle(176, 70, 24, PAL.pele);
  k.shade([156, 60, 160, 48, 176, 42, 194, 48, 199, 62, 190, 55, 176, 52, 162, 56], PAL.peleSombra);
  k.eye(167, 70, 5);
  k.eye(184, 70, 5);
  g.lineStyle(3, PAL.tinta, 1).beginPath();
  g.arc(174, 80, 8, Math.PI * 0.15, Math.PI * 0.85);
  g.strokePath();
}

function drawLobisomem(g: G): void {
  const k = new Ink(g, 4);
  k.rect(100, 232, 32, 80, PAL.loboSombra, 10);
  k.rect(168, 232, 32, 80, PAL.loboSombra, 10);
  k.ellipse(110, 314, 54, 22, PAL.lobo);
  k.ellipse(190, 314, 54, 22, PAL.lobo);
  // braços
  k.poly([70, 118, 30, 190, 40, 250, 64, 248, 60, 200, 104, 150], PAL.loboSombra);
  k.poly([230, 118, 270, 190, 260, 250, 236, 248, 240, 200, 196, 150], PAL.loboSombra);
  for (const [x, d] of [
    [40, -1],
    [260, 1],
  ] as const) {
    for (let i = 0; i < 3; i++) {
      const cx = x - 10 + i * 10;
      k.poly([cx - 4, 248, cx + 4, 248, cx + d * 2, 266], PAL.pelePapel, 2);
    }
  }
  // tronco em triângulo invertido
  k.poly([40, 104, 260, 104, 150, 262], PAL.lobo);
  k.shade([150, 106, 257, 106, 150, 258], PAL.loboSombra);
  k.line([110, 150, 125, 166, 140, 150, 155, 168, 170, 150, 185, 166], PAL.loboSombra, 3);
  g.lineStyle(4, PAL.tinta, 1).strokePoints(
    [
      { x: 40, y: 104 },
      { x: 260, y: 104 },
      { x: 150, y: 262 },
    ],
    true,
    true,
  );
  // cabeça
  k.poly([104, 62, 94, 6, 134, 42], PAL.lobo);
  k.poly([196, 62, 206, 6, 166, 42], PAL.lobo);
  k.shade([106, 52, 100, 22, 122, 44], PAL.perigo, 0.6);
  k.shade([194, 52, 200, 22, 178, 44], PAL.perigo, 0.6);
  k.circle(150, 88, 52, PAL.lobo);
  k.shade([150, 37, 186, 50, 200, 84, 196, 110, 150, 140], PAL.loboSombra, 0.55);
  g.lineStyle(4, PAL.tinta, 1).strokeCircle(150, 88, 52);
  k.ellipse(150, 114, 66, 40, PAL.loboSombra);
  k.ellipse(150, 100, 20, 13, PAL.tinta, 0);
  k.poly([132, 124, 140, 124, 136, 138], PAL.branco, 2);
  k.poly([160, 124, 168, 124, 164, 138], PAL.branco, 2);
  // olhos dourados com sobrancelhas bravas
  for (const x of [124, 176]) {
    k.ellipse(x, 78, 26, 16, PAL.ouro, 3);
    g.fillStyle(PAL.tinta, 1).fillRect(x - 2, 71, 4, 14);
  }
  k.poly([104, 62, 140, 72, 138, 78, 102, 68], PAL.tinta, 0);
  k.poly([196, 62, 160, 72, 162, 78, 198, 68], PAL.tinta, 0);
}

function drawTeiniagua(g: G): void {
  const k = new Ink(g, 4);
  const seg = (i: number) => ({
    x: 112 + i * 30,
    y: 150 + Math.sin(i * 0.9 + 0.5) * 22,
    w: 80 - i * 7,
    h: 56 - i * 5,
  });
  // pernas
  k.line([138, 160, 118, 196, 100, 204], PAL.teiniaguaSombra, 10);
  k.line([160, 168, 176, 202, 194, 208], PAL.teiniaguaSombra, 10);
  k.line([226, 150, 212, 186, 196, 192], PAL.teiniaguaSombra, 9);
  k.line([244, 150, 262, 184, 278, 186], PAL.teiniaguaSombra, 9);
  // ponta da cauda
  const last = seg(7);
  k.poly(
    [last.x + 8, last.y - 8, last.x + 48, last.y - 36, last.x + 14, last.y + 8],
    PAL.teiniaguaSombra,
    3,
  );
  for (let i = 7; i >= 0; i--) {
    const s = seg(i);
    k.ellipse(s.x, s.y, s.w, s.h, PAL.teiniagua);
    g.fillStyle(PAL.teiniaguaSombra, 1).fillEllipse(s.x, s.y + s.h * 0.22, s.w * 0.7, s.h * 0.35);
    g.fillStyle(PAL.teiniaguaSombra, 1).fillCircle(
      s.x - 4,
      s.y - s.h * 0.18,
      Math.max(3, s.h * 0.1),
    );
  }
  // cabeça
  k.ellipse(72, 136, 96, 62, PAL.teiniagua);
  g.fillStyle(PAL.teiniaguaSombra, 1).fillEllipse(70, 152, 70, 18);
  g.lineStyle(3, PAL.tinta, 1).beginPath();
  g.moveTo(26, 146);
  g.lineTo(80, 150);
  g.strokePath();
  k.eye(84, 128, 10, PAL.ouro);
  g.fillStyle(PAL.tinta, 1).fillRect(85, 122, 3, 12);
  // pedra-carbúnculo
  k.circle(66, 104, 14, PAL.carbunculo, 3);
  g.fillStyle(PAL.ouroClaro, 0.8).fillCircle(61, 99, 4);
}

function drawSalamanca(g: G): void {
  const k = new Ink(g, 6);
  const rock = [
    20, 410, 26, 300, 60, 190, 120, 110, 200, 60, 290, 58, 360, 100, 410, 180, 440, 290, 445, 410,
  ];
  k.poly(rock, PAL.pedra);
  k.shade(
    [290, 60, 358, 102, 406, 182, 436, 290, 440, 406, 332, 406, 352, 300, 330, 160],
    PAL.pedraSombra,
  );
  const rv: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i < rock.length; i += 2) rv.push({ x: rock[i], y: rock[i + 1] });
  g.lineStyle(6, PAL.tinta, 1).strokePoints(rv, true, true);
  // rachaduras
  g.lineStyle(3, PAL.tinta, 1);
  g.strokePoints(
    [
      { x: 90, y: 160 },
      { x: 108, y: 186 },
      { x: 96, y: 214 },
    ],
    false,
  );
  g.strokePoints(
    [
      { x: 380, y: 200 },
      { x: 362, y: 228 },
      { x: 378, y: 250 },
    ],
    false,
  );
  g.strokePoints(
    [
      { x: 240, y: 70 },
      { x: 232, y: 110 },
      { x: 250, y: 134 },
    ],
    false,
  );
  // furna (boca)
  k.ellipse(232, 332, 210, 136, PAL.tinta, 0);
  g.fillStyle(PAL.brasa, 0.35).fillEllipse(232, 350, 150, 76);
  for (const x of [168, 204, 240, 276]) k.poly([x, 272, x + 20, 270, x + 9, 302], PAL.pedra, 3);
  for (const x of [184, 226, 262]) k.poly([x, 406, x + 22, 406, x + 11, 376], PAL.pedra, 3);
  // sobrancelhas e olhos de brasa
  k.poly([116, 170, 212, 188, 208, 208, 114, 190], PAL.pedraSombra, 4);
  k.poly([348, 170, 252, 188, 256, 208, 350, 190], PAL.pedraSombra, 4);
  for (const x of [165, 299]) {
    k.ellipse(x, 220, 62, 32, PAL.brasa, 4);
    g.fillStyle(PAL.ouro, 1).fillEllipse(x, 220, 28, 14);
  }
  // lagartixa gigante enroscada na furna
  const n = 16;
  const pts: { x: number; y: number; w: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = Math.PI * (1.02 - t * 1.04);
    pts.push({ x: 232 + Math.cos(a) * 196, y: 268 - Math.sin(a) * 214, w: 52 - t * 34 });
  }
  const k4 = new Ink(g, 4);
  k4.poly(
    [
      pts[n - 1].x,
      pts[n - 1].y,
      pts[n - 1].x + 30,
      pts[n - 1].y + 40,
      pts[n - 1].x - 6,
      pts[n - 1].y + 12,
    ],
    PAL.teiniaguaSombra,
    3,
  );
  for (let i = n - 1; i >= 0; i--) {
    const p = pts[i];
    k4.ellipse(p.x, p.y, p.w, p.w * 0.8, PAL.teiniagua);
    g.fillStyle(PAL.teiniaguaSombra, 1).fillCircle(p.x, p.y + p.w * 0.12, p.w * 0.18);
  }
  k4.ellipse(44, 326, 72, 48, PAL.teiniagua);
  k4.eye(56, 320, 8, PAL.ouro);
  k4.circle(48, 302, 11, PAL.carbunculo, 3);
}

function drawPlayer(g: G): void {
  const k = new Ink(g, 4);
  k.rect(62, 240, 32, 34, PAL.chapeu, 6);
  k.rect(106, 240, 32, 34, PAL.chapeu, 6);
  k.poly([60, 170, 100, 170, 96, 248, 62, 248], PAL.bombacha);
  k.poly([100, 170, 140, 170, 138, 248, 104, 248], PAL.bombacha);
  k.circle(150, 178, 11, PAL.peleClara, 3);
  // poncho
  const pon = [70, 84, 130, 84, 168, 192, 32, 192];
  k.poly(pon, PAL.poncho);
  k.shade([100, 86, 129, 86, 165, 190, 100, 190], PAL.ponchoSombra);
  k.shade([38, 172, 161, 172, 165, 182, 35, 182], PAL.ouro);
  g.lineStyle(4, PAL.tinta, 1).strokePoints(
    [
      { x: 70, y: 84 },
      { x: 130, y: 84 },
      { x: 168, y: 192 },
      { x: 32, y: 192 },
    ],
    true,
    true,
  );
  // lenço azul
  k.poly([78, 84, 122, 84, 100, 116], PAL.jogador, 3);
  k.shade([100, 86, 120, 86, 100, 112], PAL.jogadorSombra);
  k.circle(100, 88, 6, PAL.jogadorSombra, 2);
  // cabeça
  k.circle(100, 58, 28, PAL.peleClara);
  k.ellipse(114, 72, 28, 9, PAL.chapeu, 2);
  k.eye(112, 52, 6);
  k.poly([124, 58, 132, 64, 124, 66], PAL.peleClara, 2);
  // chapéu
  k.rect(74, 6, 50, 32, PAL.chapeu, 8);
  g.fillStyle(PAL.jogador, 1).fillRect(76, 28, 46, 6);
  k.ellipse(100, 38, 104, 18, PAL.chapeu);
}

// ---------------------------------------------------------------- arte das cartas

function horse(k: Ink, x: number, y: number, s: number, col: number): void {
  k.line([x - 12 * s, y + 6 * s, x - 14 * s, y + 24 * s], col, 4 * s);
  k.line([x + 12 * s, y + 6 * s, x + 14 * s, y + 24 * s], col, 4 * s);
  k.ellipse(x, y, 44 * s, 22 * s, col, 3);
  k.poly(
    [
      x - 16 * s,
      y - 4 * s,
      x - 30 * s,
      y - 22 * s,
      x - 38 * s,
      y - 14 * s,
      x - 30 * s,
      y - 26 * s,
      x - 18 * s,
      y - 24 * s,
      x - 6 * s,
      y - 8 * s,
    ],
    col,
    3,
  );
}

function drawArtIcon(g: G, kind: ArtKind): void {
  const k = new Ink(g, 3);
  switch (kind) {
    case 'relho':
      k.line(
        curve(12, (t) => [70 + t * 64, 52 - Math.sin(t * Math.PI) * 36 + t * 24]),
        PAL.chapeu,
        4,
      );
      k.line([40, 84, 70, 52], PAL.madeira, 9);
      break;
    case 'laco':
      g.lineStyle(12, PAL.tinta, 1).strokeEllipse(96, 44, 72, 46);
      g.lineStyle(6, PAL.baio, 1).strokeEllipse(96, 44, 72, 46);
      k.line([60, 52, 46, 70, 38, 90], PAL.baio, 6);
      break;
    case 'facao':
      k.poly([52, 74, 120, 24, 134, 20, 128, 34, 62, 82], PAL.pelePapel);
      k.line([54, 76, 36, 92], PAL.madeira, 9);
      k.line([44, 68, 62, 86], PAL.ouro, 4);
      break;
    case 'boleadeira':
      k.line([82, 48, 50, 76], PAL.baio, 3);
      k.line([82, 48, 114, 76], PAL.baio, 3);
      k.line([82, 48, 82, 20], PAL.baio, 3);
      k.circle(50, 76, 11, PAL.pedra);
      k.circle(114, 76, 11, PAL.pedra);
      k.circle(82, 20, 11, PAL.pedra);
      break;
    case 'cavalos':
      horse(k, 124, 58, 0.85, PAL.chapeu);
      horse(k, 58, 62, 0.85, PAL.baioSombra);
      horse(k, 94, 70, 1, PAL.baio);
      break;
    case 'vento':
      for (const [y, d] of [
        [30, 0],
        [52, 14],
        [74, -8],
      ] as const) {
        k.line(
          curve(14, (t) => {
            if (t < 0.7) return [26 + d + t * 130, y + Math.sin(t * 9) * 4];
            const a = ((t - 0.7) / 0.3) * Math.PI * 1.5;
            return [117 + d + Math.sin(a) * 10, y - 10 + Math.cos(a) * 10];
          }),
          PAL.branco,
          5,
        );
      }
      break;
    case 'raio':
      k.poly([98, 6, 58, 54, 80, 54, 62, 96, 114, 40, 90, 40, 110, 6], PAL.ouro);
      break;
    case 'poncho':
      k.poly([62, 22, 102, 22, 132, 86, 32, 86], PAL.poncho);
      k.shade([82, 24, 101, 24, 130, 84, 82, 84], PAL.ponchoSombra);
      k.shade([37, 72, 127, 72, 130, 79, 34, 79], PAL.ouro);
      k.ellipse(82, 24, 20, 8, PAL.tinta, 0);
      break;
    case 'sela':
      k.poly([40, 60, 50, 38, 70, 48, 100, 48, 116, 32, 128, 44, 120, 66, 48, 70], PAL.madeira);
      k.line([82, 68, 80, 84], PAL.chapeu, 3);
      k.rect(70, 84, 22, 8, PAL.ouro, 2);
      break;
    case 'galpao':
      k.rect(46, 46, 72, 42, PAL.madeira);
      k.poly([36, 50, 82, 16, 128, 50], PAL.poncho);
      k.rect(74, 62, 16, 26, PAL.chapeu);
      k.rect(54, 56, 14, 12, PAL.ouro, 0, 2);
      break;
    case 'sanga':
      k.ellipse(82, 76, 124, 26, PAL.jogador);
      for (const [x1, x2, h] of [
        [40, 36, 38],
        [52, 58, 46],
        [114, 120, 42],
        [124, 128, 30],
      ] as const) {
        k.line([x1, 76, x2, 76 - h], PAL.coxilhaSombra, 3);
        k.ellipse(x2, 76 - h, 6, 14, PAL.chapeu, 2);
      }
      break;
    case 'esquiva':
      k.line(
        curve(12, (t) => [36 + t * 84, 74 - Math.sin(t * Math.PI) * 50]),
        PAL.pelePapel,
        8,
      );
      k.poly([110, 56, 134, 70, 112, 80], PAL.pelePapel);
      k.line([30, 40, 50, 40], PAL.branco, 3);
      k.line([24, 54, 44, 54], PAL.branco, 3);
      break;
    case 'cuia':
      k.circle(80, 62, 28, PAL.baioSombra);
      k.ellipse(80, 40, 42, 13, PAL.madeira);
      g.fillStyle(PAL.buff, 1).fillEllipse(80, 40, 32, 7);
      k.line([84, 40, 106, 12], PAL.ouro, 4);
      break;
    case 'fogo':
      k.line([48, 86, 116, 74], PAL.madeira, 8);
      k.line([48, 74, 116, 86], PAL.madeira, 8);
      k.poly([82, 10, 106, 50, 100, 78, 64, 78, 58, 50], PAL.brasa);
      k.shade([82, 36, 93, 58, 89, 74, 75, 74, 71, 58], PAL.ouro);
      break;
    case 'grito':
      for (const r of [30, 44, 58]) {
        k.line(
          curve(8, (t) => [56 + Math.cos(-0.7 + t * 1.4) * r, 54 + Math.sin(-0.7 + t * 1.4) * r]),
          PAL.ouro,
          4,
        );
      }
      k.circle(52, 54, 20, PAL.peleClara);
      k.ellipse(60, 60, 12, 10, PAL.tinta, 0);
      break;
    case 'olho':
      k.ellipse(82, 52, 104, 54, PAL.pelePapel);
      k.circle(82, 52, 20, PAL.carbunculo);
      g.fillStyle(PAL.tinta, 1).fillCircle(82, 52, 8);
      g.fillStyle(PAL.branco, 1).fillCircle(76, 46, 4);
      break;
    case 'espiral':
      k.line(
        curve(40, (t) => {
          const a = t * Math.PI * 5;
          const r = 4 + t * 34;
          return [82 + Math.cos(a) * r, 52 + Math.sin(a) * r * 0.9];
        }),
        PAL.teiniagua,
        5,
      );
      break;
    case 'chaleira':
      k.poly([104, 58, 132, 38, 136, 46, 108, 72], PAL.pedra);
      k.line([62, 42, 80, 26, 98, 42], PAL.chapeu, 4);
      k.ellipse(80, 64, 62, 46, PAL.pedra);
      k.ellipse(80, 42, 28, 9, PAL.pedraSombra, 2);
      k.line([132, 32, 126, 22, 132, 12], PAL.branco, 3);
      break;
    case 'pala':
      k.poly([36, 28, 128, 22, 134, 80, 92, 70, 40, 86], PAL.poder);
      k.shade([38, 44, 129, 38, 130, 46, 38, 52], PAL.ouro);
      k.shade([39, 64, 132, 60, 132, 66, 40, 72], PAL.ouro);
      for (let i = 0; i < 6; i++)
        k.line([46 + i * 15, 82 - i * 2, 44 + i * 15, 94 - i * 2], PAL.ouro, 2);
      break;
    case 'vela':
      g.fillStyle(PAL.ouroClaro, 0.25).fillCircle(82, 26, 32);
      g.fillStyle(PAL.ouroClaro, 0.35).fillCircle(82, 26, 20);
      k.rect(70, 40, 24, 52, PAL.pelePapel, 3);
      k.poly([82, 6, 93, 26, 82, 38, 71, 26], PAL.ouro);
      break;
  }
}

export const ART_W = 164;
export const ART_H = 100;

function drawArt(g: G, kind: ArtKind): void {
  g.fillGradientStyle(PAL.ceuAlto, PAL.ceuAlto, PAL.ceuBaixo, PAL.ceuBaixo, 1);
  g.fillRect(0, 0, ART_W, ART_H);
  g.fillStyle(PAL.ouroClaro, 0.7).fillCircle(130, 70, 14);
  const hill = curve(20, (t) => [t * ART_W, 78 + Math.sin(t * 6 + 1) * 6]);
  g.fillStyle(PAL.coxilha, 1).fillPoints(
    [{ x: 0, y: ART_H }, ...pairs(hill), { x: ART_W, y: ART_H }],
    true,
  );
  drawArtIcon(g, kind);
}

function pairs(a: number[]): Phaser.Types.Math.Vector2Like[] {
  const v: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i < a.length; i += 2) v.push({ x: a[i], y: a[i + 1] });
  return v;
}

// ---------------------------------------------------------------- ícones

function drawIntent(g: G, kind: 'attack' | 'defend' | 'buff' | 'debuff'): void {
  const k = new Ink(g, 3);
  if (kind === 'attack') {
    k.poly([12, 36, 34, 6, 42, 4, 40, 12, 16, 40], PAL.perigo);
    k.line([7, 28, 22, 43], PAL.ouro, 5);
    k.line([9, 41, 4, 46], PAL.chapeu, 4);
  } else if (kind === 'defend') {
    k.poly([24, 3, 42, 9, 40, 28, 24, 45, 8, 28, 6, 9], PAL.jogador);
    k.shade([24, 7, 38, 12, 36, 27, 24, 40], PAL.jogadorSombra);
  } else if (kind === 'buff') {
    k.poly([24, 3, 43, 22, 32, 22, 32, 45, 16, 45, 16, 22, 5, 22], PAL.buff);
  } else {
    k.poly([24, 45, 43, 26, 32, 26, 32, 3, 16, 3, 16, 26, 5, 26], PAL.inimigo);
  }
}

export function generateTextures(scene: Phaser.Scene): void {
  bake(scene, 'spark', 12, 12, (g) => g.fillStyle(PAL.branco, 1).fillCircle(6, 6, 6));
  bake(scene, 'light', 128, 128, (g) => {
    for (let i = 0; i < 20; i++) g.fillStyle(PAL.branco, 0.05).fillCircle(64, 64, 64 - i * 3.1);
  });
  bake(scene, 'cloud', 240, 90, (g) => {
    g.fillStyle(PAL.nuvem, 1);
    g.fillEllipse(70, 58, 110, 44).fillEllipse(130, 44, 120, 60).fillEllipse(180, 60, 100, 40);
    g.fillEllipse(120, 66, 180, 34);
  });
  bake(scene, 'player', 200, 280, drawPlayer);
  bake(scene, ENEMY_ART.negrinho.key, ENEMY_ART.negrinho.w, ENEMY_ART.negrinho.h, drawNegrinho);
  bake(scene, ENEMY_ART.lobisomem.key, ENEMY_ART.lobisomem.w, ENEMY_ART.lobisomem.h, drawLobisomem);
  bake(scene, ENEMY_ART.teiniagua.key, ENEMY_ART.teiniagua.w, ENEMY_ART.teiniagua.h, drawTeiniagua);
  bake(scene, ENEMY_ART.salamanca.key, ENEMY_ART.salamanca.w, ENEMY_ART.salamanca.h, drawSalamanca);
  for (const kind of ['attack', 'defend', 'buff', 'debuff'] as const) {
    bake(scene, `intent-${kind}`, 48, 48, (g) => drawIntent(g, kind));
  }
  const arts: ArtKind[] = [
    'relho',
    'laco',
    'facao',
    'boleadeira',
    'cavalos',
    'vento',
    'raio',
    'poncho',
    'sela',
    'galpao',
    'sanga',
    'esquiva',
    'cuia',
    'fogo',
    'grito',
    'olho',
    'espiral',
    'chaleira',
    'pala',
    'vela',
  ];
  for (const a of arts) bake(scene, `art-${a}`, ART_W, ART_H, (g) => drawArt(g, a));

  // relíquias
  bake(scene, 'relic-carbunculo', 44, 44, (g) => {
    const k = new Ink(g, 3);
    k.poly([22, 3, 38, 14, 34, 36, 22, 42, 10, 36, 6, 14], PAL.carbunculo);
    k.shade([22, 6, 34, 15, 22, 22], PAL.ouroClaro, 0.6);
  });
  bake(scene, 'relic-guampa', 44, 44, (g) => {
    const k = new Ink(g, 3);
    k.poly([4, 30, 14, 20, 28, 14, 40, 4, 36, 18, 26, 30, 12, 40], PAL.pelePapel);
    k.shade([4, 30, 12, 40, 16, 36, 9, 27], PAL.ouro);
  });
  // nós do mapa
  bake(scene, 'node-combat', 80, 80, (g) => {
    const k = new Ink(g, 4);
    k.circle(40, 40, 36, PAL.pelePapel);
    k.line([22, 58, 58, 22], PAL.perigo, 6);
    k.line([22, 22, 58, 58], PAL.perigo, 6);
    k.line([18, 44, 34, 60], PAL.ouro, 4);
    k.line([62, 44, 46, 60], PAL.ouro, 4);
  });
  bake(scene, 'node-event', 80, 80, (g) => {
    const k = new Ink(g, 4);
    k.circle(40, 40, 36, PAL.pelePapel);
    k.line([22, 60, 58, 54], PAL.madeira, 6);
    k.line([22, 54, 58, 60], PAL.madeira, 6);
    k.poly([40, 14, 54, 40, 50, 54, 30, 54, 26, 40], PAL.brasa, 3);
    k.shade([40, 30, 46, 44, 44, 52, 36, 52, 34, 44], PAL.ouro);
  });
  bake(scene, 'node-boss', 96, 96, (g) => {
    const k = new Ink(g, 4);
    k.circle(48, 48, 44, PAL.pedra);
    k.ellipse(48, 66, 40, 22, PAL.tinta, 0);
    k.ellipse(32, 40, 20, 12, PAL.brasa, 3);
    k.ellipse(64, 40, 20, 12, PAL.brasa, 3);
  });
  // pilhas
  bake(scene, 'pile', 72, 96, (g) => {
    const k = new Ink(g, 4);
    k.rect(10, 4, 58, 84, PAL.inimigo, 8);
    k.rect(4, 8, 58, 84, PAL.poderFaixa, 8);
    k.rect(12, 16, 42, 68, PAL.inimigo, 6, 2);
    k.circle(33, 50, 10, PAL.ouro, 2);
  });
}
