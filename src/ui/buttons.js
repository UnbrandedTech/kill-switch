
import { Button, Text } from 'kontra';
import { world } from '../world.js';
import { getSprite } from '../assets/index.js';

const FONT = '18px Cyberphont, system-ui, sans-serif';
const FONT_SUB = '12px Cyberphont, system-ui, sans-serif';

const VARIANT_INK = {
  blue:   { fg: '#fff',    sub: 'rgba(255,255,255,0.82)' },
  red:    { fg: '#fff',    sub: 'rgba(255,255,255,0.85)' },
  yellow: { fg: '#1a1d28', sub: 'rgba(26,29,40,0.82)' }
};

const DEFAULT_VARIANT = 'blue';

export function makeButton({
  x = 0,
  y = 0,
  width = 140,
  height = 50,
  text,
  sub,
  color: _color, 
  variant: variantOverride,
  font = FONT,
  textColor,
  subColor,
  onDown
}) {
  const variant = variantOverride ?? DEFAULT_VARIANT;
  const ink = textColor ?? VARIANT_INK[variant].fg;
  const subInk = subColor ?? VARIANT_INK[variant].sub;

  const btn = Button({
    x,
    y,
    width,
    height,
    anchor: { x: 0, y: 0 },
    color: 'transparent',
    text: {
      text,
      font,
      color: ink,
      anchor: { x: 0.5, y: 0.5 },
      textAlign: 'center',
      x: width / 2,
      y: sub ? height * 0.34 : height / 2
    },
    onDown(...args) {
      world._uiConsumed = true;
      onDown?.(...args);
    }
  });

  btn._variant = variant;

  const drawSprite = function () {
    const ctx = this.context;
    const sprite = getSprite(`btn_${this._variant}`);
    if (!sprite) {
      ctx.fillStyle = '#1a1d28';
      ctx.fillRect(0, 0, this.width, this.height);
      return;
    }
    const halfW = Math.floor(sprite.width / 2);
    const sx = this.pressed ? halfW : 0;
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, sx, 0, halfW, sprite.height,
      0, 0, this.width, this.height);
    ctx.imageSmoothingEnabled = prev;
  };
  btn._rf = drawSprite;
  btn.draw = drawSprite;

  const origDisable = btn.disable.bind(btn);
  const origEnable = btn.enable.bind(btn);
  btn.disable = function () { origDisable(); this.opacity = 0.4; };
  btn.enable  = function () { origEnable();  this.opacity = 1; };

  if (sub) {
    btn._sub = Text({
      text: sub,
      font: FONT_SUB,
      color: subInk,
      anchor: { x: 0.5, y: 0.5 },
      textAlign: 'center',
      x: width / 2,
      y: height * 0.72
    });
    btn.addChild(btn._sub);
  }

  return btn;
}

export function setSub(btn, text) {
  if (btn._sub) btn._sub.text = text;
}

export function makeText({
  x,
  y,
  text,
  font = FONT,
  color = '#fff',
  anchor = { x: 0.5, y: 0.5 }
}) {
  return Text({ x, y, text, font, color, anchor });
}
