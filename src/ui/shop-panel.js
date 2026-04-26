
import { Grid } from 'kontra';
import { world } from '../world.js';
import {
  CANVAS_W, PLAYFIELD_TOP, PLAYFIELD_BOTTOM, SHOP_PANEL_H,
  TILE_SIZE, TURRET_H, snapToTile
} from '../config.js';
import { TOWERS, TOWER_ORDER } from '../data/towers.js';
import { Tower } from '../entities/tower.js';
import { spendGold, canAfford } from '../systems/economy.js';
import { pickTowerAt } from '../systems/input.js';
import { isPolylineClearOf } from '../systems/path.js';
import { makeButton, makeText, setSub } from './buttons.js';

export function canPlaceTowerAt(point) {
  if (!world.path) return true;
  return isPolylineClearOf(world.path.waypoints, [point]);
}

const PANEL_H = SHOP_PANEL_H;
const BUY_BTN_W = 170;
const BUY_BTN_H = 70;
const BUY_BTN_FONT = 'bold 13px Cyberphont, system-ui, sans-serif';

let _ui = null;

function panelTop() {
  return PLAYFIELD_BOTTOM;
}

function build() {
  if (_ui) return _ui;

  const buyButtons = TOWER_ORDER.map((type) => {
    const def = TOWERS[type];
    return makeButton({
      width: BUY_BTN_W,
      height: BUY_BTN_H,
      text: def.name,
      sub: `${def.cost}g`,
      font: BUY_BTN_FONT,
      onDown: () => beginPlace(type)
    });
  });

  const buyGrid = Grid({
    x: 16,
    y: panelTop() + (PANEL_H - BUY_BTN_H) / 2,
    flow: 'row',
    colGap: 12
  });
  for (const b of buyButtons) buyGrid.addChild(b);

  const startBtn = makeButton({
    x: CANVAS_W - 16 - 200,
    y: panelTop() + (PANEL_H - BUY_BTN_H) / 2,
    width: 200,
    height: BUY_BTN_H,
    text: 'Start Wave',
    sub: 'wave 1',
    onDown: () => actionButtonClick()
  });

  const cardX = 16;
  const cardW = 560;
  const cardH = 100;
  const cardY = panelTop() - cardH - 6;
  const BTN_W = 110;
  const BTN_H = 40;
  const BTN_GAP = 8;
  const BUTTON_ROW = 4;
  const buttonRowW = BUTTON_ROW * BTN_W + (BUTTON_ROW - 1) * BTN_GAP;
  const buttonRowX = cardX + (cardW - buttonRowW) / 2;
  const buttonRowY = cardY + cardH - 10 - BTN_H;

  const cardBtnDefs = [
    { text: '+ Damage', path: 'damage' },
    { text: '+ Rate',   path: 'fireRate' },
    { text: '+ Reload', path: 'reload' },
    { text: 'Sell',     sell: true }
  ];
  const cardBtns = cardBtnDefs.map((d, i) => makeButton({
    x: buttonRowX + i * (BTN_W + BTN_GAP),
    y: buttonRowY,
    width: BTN_W,
    height: BTN_H,
    font: 'bold 14px Cyberphont, system-ui, sans-serif',
    text: d.text,
    sub: d.sell ? '0g' : '40g',
    onDown: () => d.sell ? sellSelected() : upgradeSelected(d.path)
  }));

  const selectedHeader = makeText({
    x: cardX + 16,
    y: cardY + 10,
    text: '',
    font: 'bold 17px Cyberphont, system-ui, sans-serif',
    color: '#fff',
    anchor: { x: 0, y: 0 }
  });
  const selectedStats = makeText({
    x: cardX + 16,
    y: cardY + 34,
    text: '',
    font: '13px Cyberphont, system-ui, sans-serif',
    color: 'rgba(216,216,216,0.9)',
    anchor: { x: 0, y: 0 }
  });

  for (const b of [...buyButtons, startBtn, ...cardBtns]) b.disable();

  _ui = {
    buyButtons, buyGrid, startBtn,
    cardBtns, cardBtnDefs,
    selectedHeader, selectedStats,
    cardX, cardY, cardW, cardH
  };
  return _ui;
}

export function activateShop() {
  build();
  for (const b of _ui.buyButtons) b.enable();
  _ui.startBtn.enable();
}

export function deactivateShop() {
  if (!_ui) return;
  for (const b of [..._ui.buyButtons, _ui.startBtn, ..._ui.cardBtns]) b.disable();
}

let _actionMode = 'start';

export function setStartButtonMode(mode) {
  _actionMode = mode;
  if (!_ui) return;
  switch (mode) {
    case 'start':
      _ui.startBtn.text = 'Start Wave';
      setSub(_ui.startBtn, `wave ${world.wave + 1}`);
      _ui.startBtn.enable();
      break;
    case 'pause':
      _ui.startBtn.text = 'Pause';
      setSub(_ui.startBtn, 'wave running');
      _ui.startBtn.enable();
      break;
    case 'resume':
      _ui.startBtn.text = 'Resume';
      setSub(_ui.startBtn, 'paused');
      _ui.startBtn.enable();
      break;
    case 'disabled':
      _ui.startBtn.disable();
      break;
  }
}

export function refreshShopState() {
  if (!_ui) return;

  for (let i = 0; i < TOWER_ORDER.length; i++) {
    const type = TOWER_ORDER[i];
    const cost = TOWERS[type].cost;
    const btn = _ui.buyButtons[i];
    if (canAfford(cost)) btn.enable();
    else btn.disable();
  }

  if (_actionMode === 'start') {
    setSub(_ui.startBtn, `wave ${world.wave + 1}`);
  }

  const t = world.selectedTower;
  if (t && !t.dead) {
    _ui.selectedHeader.text = `${t.def.name} · Lv ${t.totalLevel()}  ` +
      `(D${t.upgrades.damage}/R${t.upgrades.fireRate}/L${t.upgrades.reload})`;
    _ui.selectedStats.text =
      `dmg ${formatNum(t.damage)}   rate ${formatNum(t.fireRate)}/s   ` +
      `mag ${t.magSize}   reload ${formatNum(t.reloadTime)}s   range ${t.range}`;

    _ui.cardBtns.forEach((btn, i) => {
      const d = _ui.cardBtnDefs[i];
      if (d.sell) {
        setSub(btn, `+${t.sellRefund()}g`);
        btn.enable();
      } else if (!t.canUpgrade(d.path)) {
        setSub(btn, 'MAX');
        btn.disable();
      } else {
        const cost = t.upgradeCost(d.path);
        setSub(btn, `${cost}g`);
        canAfford(cost) ? btn.enable() : btn.disable();
      }
    });
  } else {
    _ui.selectedHeader.text = '';
    _ui.selectedStats.text = '';
    for (const b of _ui.cardBtns) b.disable();
    if (t) world.selectedTower = null;
  }
}

function formatNum(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function drawShopPanel(ctx, { selectedTower } = {}) {
  if (!_ui) return;

  ctx.fillStyle = 'rgba(8, 10, 14, 0.9)';
  ctx.fillRect(0, panelTop(), CANVAS_W, PANEL_H);

  if (selectedTower) {
    const { cardX, cardY, cardW, cardH } = _ui;
    ctx.fillStyle = 'rgba(20, 24, 34, 0.96)';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1);
    ctx.fillStyle = selectedTower.color;
    ctx.fillRect(cardX, cardY, 4, cardH);
  }

  _ui.buyGrid.render();
  _ui.startBtn.render();
  _ui.selectedHeader.render();
  _ui.selectedStats.render();
  if (selectedTower) for (const b of _ui.cardBtns) b.render();
}

function isPlayfieldClick(p) {
  return p.y > PLAYFIELD_TOP && p.y < panelTop();
}

export function drawPendingTowerPreview(ctx) {
  if (!world.pendingTower) return;
  const def = TOWERS[world.pendingTower.type];
  if (!def) return;
  const snapped = snapToTile(world.pendingTower.x, world.pendingTower.y);
  const half = TILE_SIZE / 2;
  const blocked = !canPlaceTowerAt(snapped);

  ctx.fillStyle = blocked ? 'rgba(207,126,126,0.10)' : 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(snapped.x, snapped.y, def.base.range, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = blocked ? 'rgba(207,126,126,0.35)' : 'rgba(255,255,255,0.15)';
  ctx.fillRect(snapped.x - half, snapped.y - half, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = blocked ? 'rgba(207,126,126,0.95)' : 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(snapped.x - half + 0.5, snapped.y - half + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

  ctx.globalAlpha = blocked ? 0.4 : 0.85;
  ctx.fillStyle = '#1a1d28';
  ctx.fillRect(snapped.x - half, snapped.y - half, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = def.color;
  ctx.fillRect(snapped.x - half, snapped.y - TURRET_H, TILE_SIZE, TURRET_H);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(snapped.x - half + 0.5, snapped.y - TURRET_H + 0.5, TILE_SIZE - 1, TURRET_H - 1);
  ctx.globalAlpha = 1;
}

export function handleRuntimeClick(p) {
  if (!isPlayfieldClick(p)) return;
  if (world.pendingTower) {
    placeTowerAt(p);
    return;
  }
  world.selectedTower = pickTowerAt(p) ?? null;
}

function placeTowerAt(p) {
  if (!world.pendingTower) return false;
  const def = TOWERS[world.pendingTower.type];
  const snapped = snapToTile(p.x, p.y);
  if (!canPlaceTowerAt(snapped)) return false;
  if (!spendGold(def.cost)) {
    world.pendingTower = null;
    return false;
  }
  const isPlaying = world.fsm?.current === 'playing';
  const waveAdded = isPlaying ? world.wave : world.wave + 1;
  world.towers.push(Tower({
    x: snapped.x,
    y: snapped.y,
    type: world.pendingTower.type,
    waveAdded
  }));
  world.pendingTower = null;
  return true;
}

function beginPlace(type) {
  const def = TOWERS[type];
  if (!canAfford(def.cost)) return;
  if (world.pendingTower?.type === type) {
    world.pendingTower = null;
    return;
  }
  world.pendingTower = { type, x: CANVAS_W / 2, y: PLAYFIELD_TOP + 100 };
  world.selectedTower = null;
}

function upgradeSelected(path) {
  const t = world.selectedTower;
  if (!t || !t.canUpgrade(path)) return;
  if (!spendGold(t.upgradeCost(path))) return;
  t.applyUpgrade(path);
}

function sellSelected() {
  const t = world.selectedTower;
  if (!t) return;
  world.gold += t.sellRefund();
  const i = world.towers.indexOf(t);
  if (i >= 0) world.towers.splice(i, 1);
  world.selectedTower = null;
}

function actionButtonClick() {
  switch (_actionMode) {
    case 'start':
      world.fsm.transition('playing');
      break;
    case 'pause':
      world.flags.paused = true;
      setStartButtonMode('resume');
      break;
    case 'resume':
      world.flags.paused = false;
      setStartButtonMode('pause');
      break;
  }
}
