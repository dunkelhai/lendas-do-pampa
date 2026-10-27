import Phaser from 'phaser';
import { generateTextures } from '../systems/textures';
import { buildAllCardTextures } from '../entities/cardTexture';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    buildAllCardTextures(this);
    this.scene.start('Title');
  }
}
