import Phaser from 'phaser';
import { FONT_TITLE, FONT_UI, PAL, PALS } from '../style/palette';
import {
  CARDS,
  TYPE_LABEL,
  describeCard,
  type CardDef,
  type CardType,
  type Rarity,
} from '../systems/cards';
import { ART_H, ART_W } from '../systems/textures';
import type { CardId } from '../config/balance';

export const CARD_W = 180;
export const CARD_H = 252;

export const FRAME: Record<CardType, { frame: number; band: number }> = {
  ataque: { frame: PAL.ataque, band: PAL.ataqueFaixa },
  defesa: { frame: PAL.defesa, band: PAL.defesaFaixa },
  buff: { frame: PAL.buff, band: PAL.buffFaixa },
  poder: { frame: PAL.poder, band: PAL.poderFaixa },
};

const RARITY_COLOR: Record<Rarity, number> = {
  comum: PAL.comum,
  incomum: PAL.incomum,
  rara: PAL.ouro,
};

const PART_COLOR = { dano: PALS.perigo, bloqueio: PALS.jogador, buff: '#357a3f' } as const;

export function cardKey(id: CardId): string {
  return `card-${id}`;
}

/** Desenha a carta inteira num RenderTexture e salva como textura `card-<id>` (cache). */
export function buildCardTexture(scene: Phaser.Scene, def: CardDef): void {
  const key = cardKey(def.id);
  if (scene.textures.exists(key)) return;
  const rt = scene.make.renderTexture({ x: 0, y: 0, width: CARD_W, height: CARD_H }, false);
  const temp: Phaser.GameObjects.GameObject[] = [];
  const col = FRAME[def.type];

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  temp.push(g);
  // moldura
  g.fillStyle(col.frame, 1).fillRoundedRect(2, 2, CARD_W - 4, CARD_H - 4, 14);
  g.lineStyle(4, PAL.tinta, 1).strokeRoundedRect(2, 2, CARD_W - 4, CARD_H - 4, 14);
  g.lineStyle(3, RARITY_COLOR[def.rarity], 1).strokeRoundedRect(8, 8, CARD_W - 16, CARD_H - 16, 9);
  // faixa do nome
  g.fillStyle(col.band, 1).fillRoundedRect(44, 14, 126, 30, 8);
  g.lineStyle(2, PAL.tinta, 1).strokeRoundedRect(44, 14, 126, 30, 8);
  // arte (moldura)
  g.fillStyle(PAL.tinta, 1).fillRect(6, 48, ART_W + 4, ART_H + 4);
  // plaquinha do tipo
  g.fillStyle(PAL.tinta, 1).fillRoundedRect(50, 150, 80, 20, 6);
  // caixa de texto
  g.fillStyle(PAL.pelePapel, 1).fillRoundedRect(12, 172, 156, 70, 8);
  g.lineStyle(2, PAL.tinta, 1).strokeRoundedRect(12, 172, 156, 70, 8);
  // custo
  g.fillStyle(PAL.ouro, 1).fillCircle(24, 24, 20);
  g.fillStyle(PAL.ouroClaro, 0.5).fillCircle(18, 17, 9);
  g.lineStyle(3, PAL.tinta, 1).strokeCircle(24, 24, 20);
  rt.draw(g, 0, 0);
  rt.draw(`art-${def.art}`, 8, 50);

  const mk = (text: string, style: Phaser.Types.GameObjects.Text.TextStyle) => {
    const t = scene.make.text({ x: 0, y: 0, text, style }, false);
    temp.push(t);
    return t;
  };

  const cost = mk(String(def.stats.cost), {
    fontFamily: FONT_TITLE,
    fontSize: '30px',
    color: PALS.branco,
    stroke: PALS.tinta,
    strokeThickness: 5,
  }).setOrigin(0.5);
  rt.draw(cost, 24, 25);

  const name = mk(def.name, {
    fontFamily: FONT_TITLE,
    fontSize: '20px',
    color: PALS.branco,
    stroke: PALS.tinta,
    strokeThickness: 4,
  }).setOrigin(0.5);
  const maxW = 118;
  if (name.width > maxW) name.setScale(maxW / name.width, 1);
  rt.draw(name, 107, 30);

  const type = mk(TYPE_LABEL[def.type], {
    fontFamily: FONT_UI,
    fontStyle: '800',
    fontSize: '16px',
    color: PALS.branco,
  }).setOrigin(0.5);
  if (type.width > 74) type.setScale(74 / type.width, 1);
  rt.draw(type, 90, 160);

  // texto com quebra de linha manual e números coloridos
  const style = { fontFamily: FONT_UI, fontStyle: '700', fontSize: '16px', color: PALS.tinta };
  type Tok = { t: Phaser.GameObjects.Text; w: number };
  const lines: Tok[][] = [[]];
  let lineW = 0;
  const space = mk(' ', style).width;
  for (const line of describeCard(def)) {
    if (lines[lines.length - 1].length > 0) {
      lines.push([]);
      lineW = 0;
    }
    let pendingSpace = false;
    for (const part of line) {
      const words = part.text.split(' ');
      words.forEach((w, wi) => {
        if (wi > 0) pendingSpace = true;
        if (w.length === 0) return;
        const t = mk(w, {
          ...style,
          color: part.color ? PART_COLOR[part.color] : PALS.tinta,
          fontStyle: part.color ? '800' : '700',
        });
        let gap = lineW > 0 && pendingSpace ? space : 0;
        if (lineW + gap + t.width > 146 && lineW > 0) {
          lines.push([]);
          lineW = 0;
          gap = 0;
        }
        lines[lines.length - 1].push({ t, w: gap });
        lineW += gap + t.width;
        pendingSpace = false;
      });
    }
  }
  const lineH = lines.length > 3 ? 16 : 19;
  const top = 207 - (lines.length * lineH) / 2;
  lines.forEach((toks, li) => {
    const total = toks.reduce((a, k) => a + k.w + k.t.width, 0);
    let x = 90 - total / 2;
    for (const tok of toks) {
      x += tok.w;
      rt.draw(tok.t, x, top + li * lineH);
      x += tok.t.width;
    }
  });

  rt.saveTexture(key);
  temp.forEach((o) => o.destroy());
}

export function buildAllCardTextures(scene: Phaser.Scene): void {
  for (const def of Object.values(CARDS)) buildCardTexture(scene, def);
}
