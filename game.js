import * as THREE from "./vendor/three.module.min.js";

const CONFIG = Object.freeze({
  roadWidth: 18,
  laneX: [-6, 0, 6],
  segmentLength: 90,
  segmentCount: 3,
  speed: 30,
  cameraHeight: 4.4,
  cameraZ: 8,
  playerRoadZ: -5,
  jumpDuration: 0.76,
});

const game = document.querySelector("#game");
const canvas = document.querySelector("#world");
const player = document.querySelector("#player");
const laneLabel = document.querySelector("#lane");
const help = document.querySelector("#help");

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x716f91, 65, 245);

const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 300);
camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraZ);
camera.lookAt(0, 0.35, -38);

scene.add(new THREE.HemisphereLight(0x9bb9e5, 0x202536, 2.05));
const sun = new THREE.DirectionalLight(0xffd9bb, 1.35);
sun.position.set(-8, 14, 4);
scene.add(sun);

const materials = {
  asphalt: new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 1, metalness: 0 }),
  shoulder: new THREE.MeshStandardMaterial({ color: 0x9aa1a5, roughness: 1 }),
  sideGround: new THREE.MeshStandardMaterial({ color: 0x515960, roughness: 1 }),
  dash: new THREE.MeshBasicMaterial({ color: 0xf4f0d8 }),
  edge: new THREE.MeshBasicMaterial({ color: 0xf3bd31 }),
  seam: new THREE.MeshBasicMaterial({ color: 0x151b22, transparent: true, opacity: 0.55 }),
};

const unitPlane = new THREE.PlaneGeometry(1, 1);
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const roadSegments = [];

function facadeTexture({ wall, window, frame, ground, columns, rows }) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = wall;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = ground;
  context.fillRect(0, 218, canvas.width, 38);
  const cellW = 128 / columns;
  const cellH = 210 / rows;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = column * cellW + cellW * 0.22;
      const y = row * cellH + cellH * 0.2;
      context.fillStyle = frame;
      context.fillRect(x - 2, y - 2, cellW * 0.56 + 4, cellH * 0.5 + 4);
      const windowPattern = (row * 11 + column * 7 + columns * 3 + rows) % 10;
      context.fillStyle = windowPattern < 6
        ? ["#ffd27a", "#f6b95f", "#ffe19a"][windowPattern % 3]
        : window;
      context.fillRect(x, y, cellW * 0.56, cellH * 0.5);
      context.fillStyle = windowPattern < 6 ? "rgba(255,248,205,.38)" : "rgba(190,210,230,.18)";
      context.fillRect(x + 2, y + 2, cellW * 0.16, cellH * 0.08);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function buildingVariant(settings, hazy = false) {
  const facade = new THREE.MeshStandardMaterial({
    map: facadeTexture(settings),
    roughness: 0.92,
    color: hazy ? 0xc8dbe3 : 0xffffff,
  });
  const roof = new THREE.MeshStandardMaterial({ color: settings.roof, roughness: 1 });
  const cornice = new THREE.MeshStandardMaterial({ color: settings.cornice, roughness: 1 });
  return { facade, roof, cornice };
}

const buildingMaterials = [
  { wall: "#536b82", window: "#182f46", frame: "#91a4b8", ground: "#303d50", roof: 0x394b61, cornice: 0x7c8fa4, columns: 4, rows: 7 },
  { wall: "#766677", window: "#20364f", frame: "#a399a8", ground: "#433b4d", roof: 0x51465a, cornice: 0x98889a, columns: 3, rows: 8 },
  { wall: "#4b5d78", window: "#162a42", frame: "#8494aa", ground: "#293548", roof: 0x344258, cornice: 0x6e8199, columns: 5, rows: 6 },
  { wall: "#626978", window: "#24394e", frame: "#9da1ac", ground: "#3b404c", roof: 0x484d5d, cornice: 0x898e9c, columns: 4, rows: 8 },
  { wall: "#625a76", window: "#1c3048", frame: "#9992aa", ground: "#3b3549", roof: 0x453f58, cornice: 0x898096, columns: 3, rows: 6 },
].map(settings => buildingVariant(settings));
const farBuildingMaterials = [
  { wall: "#69778e", window: "#46556e", frame: "#8792a6", ground: "#566178", roof: 0x5d697f, cornice: 0x7d889d, columns: 4, rows: 7 },
  { wall: "#716f87", window: "#4a526a", frame: "#918fa3", ground: "#5b5a70", roof: 0x626176, cornice: 0x858499, columns: 3, rows: 8 },
  { wall: "#606f89", window: "#404f6b", frame: "#818da5", ground: "#4e5b73", roof: 0x55627a, cornice: 0x758199, columns: 5, rows: 6 },
].map(settings => buildingVariant(settings, true));

const textureLoader = new THREE.TextureLoader();
function spriteMaterial(path) {
  const map = textureLoader.load(path);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, alphaTest: 0.04 });
}

const scenery = {
  tree: { material: spriteMaterial("assets/environment/game1/tree_01.webp"), width: 8, height: 12 },
  lamp: { material: spriteMaterial("assets/environment/game1/street_lamp_01.webp"), width: 5, height: 10 },
};

const propMaterials = {
  wood: new THREE.MeshStandardMaterial({ color: 0xb96d37, roughness: 0.82 }),
  woodEdge: new THREE.MeshStandardMaterial({ color: 0x814626, roughness: 0.9 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x28343c, roughness: 0.62, metalness: 0.32 }),
  rampTop: new THREE.MeshStandardMaterial({ color: 0x5d8292, roughness: 0.8, side: THREE.DoubleSide }),
  rampSide: new THREE.MeshStandardMaterial({ color: 0x365665, roughness: 0.9, side: THREE.DoubleSide }),
};

const benchSeatGeometry = new THREE.BoxGeometry(0.9, 0.22, 4.4);
const benchBackGeometry = new THREE.BoxGeometry(0.2, 1.15, 4.4);
const benchLegGeometry = new THREE.BoxGeometry(0.18, 0.72, 0.24);
const railGeometry = new THREE.CylinderGeometry(0.09, 0.09, 3.8, 8);
const railSupportGeometry = new THREE.CylinderGeometry(0.075, 0.075, 0.75, 8);

function extrudedRampGeometry(points, depth) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index++) shape.lineTo(points[index][0], points[index][1]);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1, curveSegments: 5 });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

const kickerGeometry = extrudedRampGeometry([[0, 0], [3.2, 0], [3.2, 1.35]], 3.2);
const quarterShape = new THREE.Shape();
quarterShape.moveTo(0, 0);
quarterShape.lineTo(3.7, 0);
quarterShape.quadraticCurveTo(1.25, 0.12, 0, 3.05);
quarterShape.closePath();
const quarterGeometry = new THREE.ExtrudeGeometry(quarterShape, { depth: 3.6, bevelEnabled: false, steps: 1, curveSegments: 6 });
quarterGeometry.translate(0, 0, -1.8);

function addBuilding(parent, x, z, width, height, depth, variant) {
  const sideMaterials = [variant.facade, variant.facade, variant.roof, variant.roof, variant.facade, variant.facade];
  const building = new THREE.Mesh(unitBox, sideMaterials);
  building.scale.set(width, height, depth);
  building.position.set(x, height / 2, z);
  parent.add(building);
  const cornice = new THREE.Mesh(unitBox, variant.cornice);
  cornice.scale.set(width * 1.06, 0.42, depth * 1.06);
  cornice.position.set(x, height + 0.21, z);
  parent.add(cornice);
}

function addScenery(parent, type, x, z) {
  const definition = scenery[type];
  const sprite = new THREE.Sprite(definition.material);
  sprite.center.set(0.5, 0);
  sprite.scale.set(definition.width, definition.height, 1);
  sprite.position.set(x, 0.04, z);
  parent.add(sprite);
}

function addBench(parent, x, z, scale = 1) {
  const bench = new THREE.Group();
  const seat = new THREE.Mesh(benchSeatGeometry, propMaterials.wood);
  seat.position.y = 0.83;
  bench.add(seat);
  const back = new THREE.Mesh(benchBackGeometry, propMaterials.woodEdge);
  back.position.set(x < 0 ? -0.38 : 0.38, 1.35, 0);
  bench.add(back);
  for (const legZ of [-1.55, 1.55]) {
    const leg = new THREE.Mesh(benchLegGeometry, propMaterials.metal);
    leg.position.set(0, 0.36, legZ);
    bench.add(leg);
  }
  bench.position.set(x, 0.02, z);
  bench.rotation.y = x < 0 ? 0.06 : -0.06;
  bench.scale.setScalar(scale);
  parent.add(bench);
}

function addSkateObject(parent, type, x, z, scale = 1) {
  const object = new THREE.Group();
  if (type === "quarter") {
    object.add(new THREE.Mesh(quarterGeometry, [propMaterials.rampTop, propMaterials.rampSide]));
  } else if (type === "kicker") {
    object.add(new THREE.Mesh(kickerGeometry, [propMaterials.rampTop, propMaterials.rampSide]));
  } else {
    const rail = new THREE.Mesh(railGeometry, propMaterials.metal);
    rail.rotation.x = Math.PI / 2;
    rail.position.y = 0.78;
    object.add(rail);
    for (const supportZ of [-1.35, 1.35]) {
      const support = new THREE.Mesh(railSupportGeometry, propMaterials.metal);
      support.position.set(0, 0.375, supportZ);
      object.add(support);
    }
  }
  object.position.set(x, 0.02, z);
  object.rotation.y = x < 0 ? 0.08 : Math.PI - 0.08;
  object.scale.setScalar(scale);
  parent.add(object);
}

function createDistantSkyline() {
  const skyline = new THREE.Group();
  const positions = [-72, -62, -53, -44, -35, -27, 27, 35, 44, 53, 62, 72];
  positions.forEach((x, index) => {
    const width = 7 + (index % 3) * 2;
    const height = 11 + (index * 7 % 18);
    const depth = 8 + (index % 2) * 4;
    addBuilding(skyline, x, -174 - (index % 4) * 8, width, height, depth, farBuildingMaterials[index % farBuildingMaterials.length]);
  });
  scene.add(skyline);
}

createDistantSkyline();

function flatMesh(width, length, material, x, z, y = 0) {
  const mesh = new THREE.Mesh(unitPlane, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(width, length, 1);
  mesh.position.set(x, y, z);
  return mesh;
}

function createRoadSegment(index) {
  const group = new THREE.Group();
  group.position.z = -index * CONFIG.segmentLength;
  group.add(flatMesh(CONFIG.roadWidth, CONFIG.segmentLength, materials.asphalt, 0, -CONFIG.segmentLength / 2));
  group.add(flatMesh(3.2, CONFIG.segmentLength, materials.shoulder, -(CONFIG.roadWidth + 3.2) / 2, -CONFIG.segmentLength / 2, 0.005));
  group.add(flatMesh(3.2, CONFIG.segmentLength, materials.shoulder, (CONFIG.roadWidth + 3.2) / 2, -CONFIG.segmentLength / 2, 0.005));
  group.add(flatMesh(48, CONFIG.segmentLength, materials.sideGround, -(CONFIG.roadWidth / 2 + 3.2 + 24), -CONFIG.segmentLength / 2, -0.006));
  group.add(flatMesh(48, CONFIG.segmentLength, materials.sideGround, CONFIG.roadWidth / 2 + 3.2 + 24, -CONFIG.segmentLength / 2, -0.006));

  for (const x of [-CONFIG.roadWidth / 2 + 0.28, CONFIG.roadWidth / 2 - 0.28]) {
    group.add(flatMesh(0.16, CONFIG.segmentLength, materials.edge, x, -CONFIG.segmentLength / 2, 0.018));
  }
  for (let z = -4; z > -CONFIG.segmentLength; z -= 9) {
    for (const x of [-3, 3]) group.add(flatMesh(0.18, 4.6, materials.dash, x, z, 0.024));
  }
  for (let z = -2; z > -CONFIG.segmentLength; z -= 6) {
    group.add(flatMesh(CONFIG.roadWidth - 0.7, 0.075, materials.seam, 0, z, 0.014));
  }

  // Sidewalk joints, buildings, and props travel as part of the recycled world segment.
  for (let z = -3; z > -CONFIG.segmentLength; z -= 6) {
    group.add(flatMesh(3, 0.07, materials.seam, -10.6, z, 0.022));
    group.add(flatMesh(3, 0.07, materials.seam, 10.6, z, 0.022));
  }

  const side = index % 2 === 0 ? -1 : 1;
  addBuilding(group, side * 22, -19, 9 + index, 12 + index * 3, 10, buildingMaterials[index % buildingMaterials.length]);
  addBuilding(group, -side * 27, -48, 12, 18 + index * 2, 13, buildingMaterials[(index + 2) % buildingMaterials.length]);
  addBuilding(group, side * 32, -76, 10, 23 - index * 2, 11, buildingMaterials[(index + 3) % buildingMaterials.length]);

  for (const z of [-10, -34, -58, -82]) {
    addScenery(group, "lamp", -11.2, z);
    addScenery(group, "lamp", 11.2, z - 4);
  }
  addScenery(group, "tree", side * 13.5, -25);
  addScenery(group, "tree", -side * 14.3, -67);
  addBench(group, -side * 13.2, -43, 0.92 + index * 0.05);
  addSkateObject(group, ["quarter", "kicker", "rail"][index % 3], side * 16.5, -72, 0.9 + index * 0.06);

  scene.add(group);
  roadSegments.push(group);
}

for (let index = 0; index < CONFIG.segmentCount; index++) createRoadSegment(index);

// Basic gameplay layer. Entities live in world space and travel with the road.
const GAMEPLAY_Z = -150;
const PLAYER_COLLISION_Z = CONFIG.playerRoadZ;
const MAX_LIVES = 5;
const gameplayEntities = [];
const gameplayPlane = new THREE.PlaneGeometry(1, 1);
gameplayPlane.translate(0, 0.5, 0);

const gameplayMaterials = {
  cardboard: new THREE.MeshStandardMaterial({ color: 0xb77a3e, roughness: 0.92 }),
  cardboardTape: new THREE.MeshStandardMaterial({ color: 0xe0bd7a, roughness: 0.88 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xf2c52d, roughness: 0.8 }),
  black: new THREE.MeshStandardMaterial({ color: 0x252b2e, roughness: 0.88 }),
  orange: new THREE.MeshStandardMaterial({ color: 0xef6c24, roughness: 0.82 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf4eee2, roughness: 0.82 }),
  bin: new THREE.MeshStandardMaterial({ color: 0x355f50, roughness: 0.9 }),
  binDark: new THREE.MeshStandardMaterial({ color: 0x203e36, roughness: 0.9 }),
};

function worldPlaneMaterial(path) {
  const material = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, side: THREE.DoubleSide });
  material.userData.worldPlanes = [];
  const map = textureLoader.load(path, loaded => {
    const image = loaded.image;
    const sample = document.createElement("canvas");
    const scale = Math.min(1, 512 / Math.max(image.width, image.height));
    sample.width = Math.round(image.width * scale);
    sample.height = Math.round(image.height * scale);
    const context = sample.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, sample.width, sample.height);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    let minX = sample.width, minY = sample.height, maxX = 0, maxY = 0;
    for (let y = 0; y < sample.height; y++) for (let x = 0; x < sample.width; x++) {
      if (pixels[(y * sample.width + x) * 4 + 3] > 12) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
    if (minX <= maxX) {
      const cropWidth = maxX - minX + 1;
      const cropHeight = maxY - minY + 1;
      loaded.repeat.set(cropWidth / sample.width, cropHeight / sample.height);
      loaded.offset.set(minX / sample.width, 1 - (maxY + 1) / sample.height);
      for (const mesh of material.userData.worldPlanes) mesh.scale.x = mesh.scale.y * cropWidth / cropHeight;
      loaded.needsUpdate = true;
    }
  });
  map.colorSpace = THREE.SRGBColorSpace;
  material.map = map;
  return material;
}

const imageMaterials = {
  trashBag: worldPlaneMaterial("assets/obstacles/trash_bag.webp"),
  bicycle: worldPlaneMaterial("assets/obstacles/bicycle.webp"),
  star: worldPlaneMaterial("assets/collectibles/crystal.webp"),
  life: worldPlaneMaterial("assets/collectibles/extra_life.webp"),
};

function planeObject(material, width, height) {
  const mesh = new THREE.Mesh(gameplayPlane, material);
  mesh.scale.set(width, height, 1);
  if (material.userData.worldPlanes) material.userData.worldPlanes.push(mesh);
  return mesh;
}

function createCardboardBox() {
  const group = new THREE.Group();
  const box = new THREE.Mesh(unitBox, gameplayMaterials.cardboard);
  box.scale.set(2.25, 1.65, 1.75);
  box.position.y = 0.825;
  group.add(box);
  const tape = new THREE.Mesh(unitBox, gameplayMaterials.cardboardTape);
  tape.scale.set(0.3, 1.68, 1.78);
  tape.position.y = 0.84;
  group.add(tape);
  return group;
}

function createRoadBump() {
  const group = new THREE.Group();
  for (let index = 0; index < 7; index++) {
    const block = new THREE.Mesh(unitBox, index % 2 ? gameplayMaterials.black : gameplayMaterials.yellow);
    block.scale.set(0.66, 0.32, 1.25);
    block.position.set((index - 3) * 0.66, 0.16, 0);
    group.add(block);
  }
  return group;
}

function createConstructionBarrier() {
  const group = new THREE.Group();
  const beam = new THREE.Mesh(unitBox, gameplayMaterials.orange);
  beam.scale.set(4.2, 1.05, 0.38);
  beam.position.y = 1.55;
  group.add(beam);
  for (const x of [-1.2, 0, 1.2]) {
    const stripe = new THREE.Mesh(unitBox, gameplayMaterials.white);
    stripe.scale.set(0.5, 1.08, 0.4);
    stripe.position.set(x, 1.55, 0.01);
    stripe.rotation.z = -0.22;
    group.add(stripe);
  }
  for (const x of [-1.55, 1.55]) {
    const post = new THREE.Mesh(unitBox, gameplayMaterials.black);
    post.scale.set(0.22, 1.15, 0.3);
    post.position.set(x, 0.58, 0);
    group.add(post);
    const foot = new THREE.Mesh(unitBox, gameplayMaterials.black);
    foot.scale.set(1.05, 0.18, 0.75);
    foot.position.set(x, 0.09, 0);
    group.add(foot);
  }
  return group;
}

function createTrashBin() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(unitBox, gameplayMaterials.bin);
  body.scale.set(2.7, 2.25, 1.75);
  body.position.y = 1.2;
  group.add(body);
  const lid = new THREE.Mesh(unitBox, gameplayMaterials.binDark);
  lid.scale.set(2.9, 0.28, 1.95);
  lid.position.y = 2.46;
  group.add(lid);
  for (const x of [-1.05, 1.05]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 8), gameplayMaterials.black);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.22, 0.74);
    group.add(wheel);
  }
  return group;
}

const obstacleDefinitions = [
  { name: "box", low: true, create: createCardboardBox },
  { name: "bump", low: true, create: createRoadBump },
  { name: "trashBag", low: true, create: () => planeObject(imageMaterials.trashBag, 2.5, 2.35) },
  { name: "barrier", low: false, create: createConstructionBarrier },
  { name: "bin", low: false, create: createTrashBin },
  { name: "bicycle", low: false, create: () => planeObject(imageMaterials.bicycle, 3.5, 2.9) },
];

const obstacleSpawnState = {
  laneCounts: [0, 0, 0],
  safeLaneCounts: [0, 0, 0],
  recentSingleLanes: [],
  typeBag: [],
  previousRoutes: [1],
  nextGap: 1.15,
  lowIndex: 0,
  highIndex: 0,
  previousRequiredJump: false,
};

function shuffledIndexes(length) {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[swap]] = [indexes[swap], indexes[index]];
  }
  return indexes;
}

function nextObstacleDefinition(excludedName = "") {
  if (!obstacleSpawnState.typeBag.length) {
    obstacleSpawnState.typeBag = shuffledIndexes(obstacleDefinitions.length);
  }
  let index = obstacleSpawnState.typeBag.pop();
  if (obstacleDefinitions[index].name === excludedName && obstacleSpawnState.typeBag.length) {
    const alternative = obstacleSpawnState.typeBag.pop();
    obstacleSpawnState.typeBag.unshift(index);
    index = alternative;
  }
  return obstacleDefinitions[index];
}

function nextObstacleByHeight(low, excludedName = "") {
  const candidates = obstacleDefinitions.filter(definition => definition.low === low && definition.name !== excludedName);
  const key = low ? "lowIndex" : "highIndex";
  const definition = candidates[obstacleSpawnState[key] % candidates.length];
  obstacleSpawnState[key] += 1;
  return definition;
}

function balancedLane(counts, excluded = []) {
  const candidates = [0, 1, 2].filter(lane => !excluded.includes(lane));
  const lowest = Math.min(...candidates.map(lane => counts[lane]));
  const preferred = candidates.filter(lane => counts[lane] <= lowest + 1);
  return preferred[Math.floor(Math.random() * preferred.length)];
}

function chooseSingleLane() {
  const recent = obstacleSpawnState.recentSingleLanes;
  const repeatedTwice = recent.length >= 2 && recent.at(-1) === recent.at(-2);
  const excluded = repeatedTwice ? [recent.at(-1)] : [];
  const candidates = [0, 1, 2].filter(lane => !excluded.includes(lane));
  const scores = candidates.map(lane => ({
    lane,
    score: obstacleSpawnState.laneCounts[lane]
      + (lane === recent.at(-1) ? 2.5 : 0)
      + Math.random() * 0.8,
  }));
  scores.sort((a, b) => a.score - b.score);
  const lane = scores[0].lane;
  recent.push(lane);
  if (recent.length > 4) recent.shift();
  return lane;
}

function addEntity({ group, kind, lane, z = GAMEPLAY_Z, low = false, label = "", correct = false, attemptId = 0 }) {
  group.position.x = CONFIG.laneX[lane];
  group.position.y += 0.035;
  group.position.z = z;
  scene.add(group);
  const entity = { group, kind, lane, low, label, correct, attemptId, resolved: false };
  gameplayEntities.push(entity);
  return entity;
}

function spawnObstaclePattern(gapSeconds) {
  const roll = Math.random();
  let blockedCount = roll < 0.12 ? 1 : roll < 0.65 ? 2 : 3;
  if (blockedCount === 3 && obstacleSpawnState.previousRequiredJump && gapSeconds < 0.9) blockedCount = 2;
  let blockedLanes;
  if (blockedCount === 1) {
    blockedLanes = [chooseSingleLane()];
  } else if (blockedCount === 2) {
    const safeLane = balancedLane(obstacleSpawnState.safeLaneCounts);
    obstacleSpawnState.safeLaneCounts[safeLane] += 1;
    blockedLanes = [0, 1, 2].filter(lane => lane !== safeLane);
  } else {
    blockedLanes = [0, 1, 2];
  }

  const definitions = [];
  let previousType = "";
  for (const lane of blockedLanes) {
    const definition = nextObstacleDefinition(previousType);
    previousType = definition.name;
    definitions.push({ lane, definition });
  }

  // A full-road formation must always contain at least one jumpable route.
  if (blockedCount === 3 && definitions.every(item => !item.definition.low)) {
    const reachableLanes = [0, 1, 2].filter(lane => obstacleSpawnState.previousRoutes.some(previous => Math.abs(previous - lane) <= (gapSeconds < 0.95 ? 1 : 2)));
    const lane = reachableLanes[Math.floor(Math.random() * reachableLanes.length)];
    const item = definitions.find(candidate => candidate.lane === lane);
    item.definition = nextObstacleByHeight(true, item.definition.name);
  }

  // Most multi-lane groups mix jumpable and dodge-only obstacle heights.
  const allLow = definitions.every(item => item.definition.low);
  const allHigh = definitions.every(item => !item.definition.low);
  if (blockedCount >= 2 && Math.random() < 0.68 && (allLow || allHigh)) {
    const index = Math.floor(Math.random() * definitions.length);
    definitions[index].definition = nextObstacleByHeight(!definitions[index].definition.low, definitions[index].definition.name);
  }

  let routeLanes = [0, 1, 2].filter(lane => {
    const obstacle = definitions.find(item => item.lane === lane);
    return !obstacle || obstacle.definition.low;
  });
  const maxLaneSteps = gapSeconds < 0.95 ? 1 : 2;
  const reachable = lane => obstacleSpawnState.previousRoutes.some(previous => Math.abs(previous - lane) <= maxLaneSteps);
  if (!routeLanes.some(reachable)) {
    const reachableBlocked = definitions
      .filter(item => reachable(item.lane))
      .sort((a, b) => Math.abs(a.lane - obstacleSpawnState.previousRoutes[0]) - Math.abs(b.lane - obstacleSpawnState.previousRoutes[0]));
    const item = reachableBlocked[0];
    item.definition = nextObstacleByHeight(true, item.definition.name);
    routeLanes = [0, 1, 2].filter(lane => {
      const obstacle = definitions.find(candidate => candidate.lane === lane);
      return !obstacle || obstacle.definition.low;
    });
  }

  obstacleSpawnState.previousRoutes = routeLanes;
  obstacleSpawnState.previousRequiredJump = blockedCount === 3;
  for (const { lane, definition } of definitions) {
    obstacleSpawnState.laneCounts[lane] += 1;
    addEntity({ group: definition.create(), kind: "obstacle", lane, low: definition.low });
  }
  return { blockedLanes, routeLanes, definitions };
}

function spawnStarChain({ forcedLane = null, startZ = GAMEPLAY_Z, length = 3 + Math.floor(Math.random() * 2), spacing = 9 } = {}) {
  const startLane = forcedLane ?? Math.floor(Math.random() * 3);
  const pattern = forcedLane !== null ? "straight" : ["straight", "straight", "diagonal", "diagonal", "zigzag"][Math.floor(Math.random() * 5)];
  const direction = startLane === 0 ? 1 : startLane === 2 ? -1 : (Math.random() < 0.5 ? -1 : 1);
  for (let index = 0; index < length; index++) {
    let lane = startLane;
    if (pattern === "diagonal") lane = Math.max(0, Math.min(2, startLane + direction * index));
    if (pattern === "zigzag") lane = Math.max(0, Math.min(2, startLane + (index % 2 ? direction : 0)));
    const star = planeObject(imageMaterials.star, 1.65, 1.65);
    star.position.y = 1.2;
    addEntity({ group: star, kind: "star", lane, z: startZ - index * spacing });
  }
}

function spawnExtraLife(lane = balancedLane(gameplayFlow.heartLaneCounts), z = GAMEPLAY_Z) {
  gameplayFlow.heartLaneCounts[lane] += 1;
  const life = planeObject(imageMaterials.life, 1.7, 1.7);
  life.position.y = 1.15;
  addEntity({ group: life, kind: "life", lane, z });
  return lane;
}

const GAME_1_QUESTIONS = [
  { sentence: "I ___ this film three times.", correct: "have seen", distractors: ["saw", "see"] },
  { sentence: "We ___ to Italy last summer.", correct: "went", distractors: ["have gone", "go"] },
  { sentence: "Mia ___ her homework yet.", correct: "hasn't finished", distractors: ["didn't finish", "doesn't finish"] },
  { sentence: "___ you ever ___ a horse?", correct: "Have / ridden", distractors: ["Did / ride", "Have / rode"] },
  { sentence: "Tom ___ me yesterday.", correct: "called", distractors: ["has called", "calls"] },
  { sentence: "I ___ that new café yet.", correct: "haven't tried", distractors: ["didn't try", "don't try"] },
  { sentence: "___ Sarah ___ you last night?", correct: "Did / text", distractors: ["Has / texted", "Did / texted"] },
  { sentence: "My parents ___ Paris several times.", correct: "have visited", distractors: ["visited", "have visit"] },
  { sentence: "I've ___ finished my homework.", correct: "just", distractors: ["yesterday", "last night"] },
  { sentence: "We saw that film ___.", correct: "last week", distractors: ["yet", "ever"] },
  { sentence: "Have you finished your project ___?", correct: "yet", distractors: ["two days ago", "last Monday"] },
  { sentence: "I haven't spoken to Emma ___ Monday.", correct: "since", distractors: ["ago", "yesterday"] },
  { sentence: "Did you see Jack ___?", correct: "yesterday", distractors: ["ever", "yet"] },
  { sentence: "She has ___ been abroad.", correct: "never", distractors: ["last year", "ago"] },
  { sentence: "He hasn't called me ___.", correct: "yet", distractors: ["last night", "two days ago"] },
];

const questionState = {
  index: 0,
  attemptId: 0,
  activeAttempt: null,
  feedbackUntil: 0,
  selectedGate: null,
  complete: false,
  pendingCompleteMessage: false,
};

function shuffled(list) {
  const result = [...list];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function gateTextTexture(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const words = text.trim().split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (attempt.length > 14 && current && lines.length === 0) { lines.push(current); current = word; }
    else current = attempt;
  }
  if (current) lines.push(current);
  const visibleLines = lines.slice(0, 2);
  const longest = Math.max(...visibleLines.map(line => line.length), 1);
  const fontSize = Math.max(54, Math.min(150, 430 / Math.max(1, longest * 0.55)));
  context.font = `900 ${fontSize}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = 12;
  context.strokeStyle = "#102438";
  context.fillStyle = "#fff4a8";
  visibleLines.forEach((line, index) => {
    const y = canvas.height / 2 + (index - (visibleLines.length - 1) / 2) * fontSize * 0.82;
    context.strokeText(line, canvas.width / 2, y, 470);
    context.fillText(line, canvas.width / 2, y, 470);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const answerPanelFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x101d2b, roughness: 0.48, metalness: 0.48 });
const answerPanelAccentMaterial = new THREE.MeshBasicMaterial({ color: 0xf4cf43 });

function createGate(label) {
  const group = new THREE.Group();
  const panelMaterial = new THREE.MeshBasicMaterial({ color: 0x21cde5, transparent: true, opacity: 0.38, side: THREE.DoubleSide });
  const panel = new THREE.Mesh(unitBox, panelMaterial);
  panel.scale.set(4.7, 3.55, 0.12);
  panel.position.y = 2.1;
  group.add(panel);
  for (const x of [-2.48, 2.48]) {
    const rail = new THREE.Mesh(unitBox, answerPanelFrameMaterial);
    rail.scale.set(0.24, 4.15, 0.3);
    rail.position.set(x, 2.12, 0);
    group.add(rail);
    const accent = new THREE.Mesh(unitBox, answerPanelAccentMaterial);
    accent.scale.set(0.3, 0.18, 0.34);
    accent.position.set(x, 4.12, 0.02);
    group.add(accent);
  }
  for (const y of [0.18, 4.08]) {
    const rail = new THREE.Mesh(unitBox, answerPanelFrameMaterial);
    rail.scale.set(5.18, 0.24, 0.3);
    rail.position.set(0, y, 0);
    group.add(rail);
  }
  const textMaterial = new THREE.MeshBasicMaterial({ map: gateTextTexture(label), transparent: true, depthWrite: false });
  const text = planeObject(textMaterial, 4.45, 2.35);
  text.position.set(0, 0.92, 0.18);
  group.add(text);
  group.userData.panelMaterial = panelMaterial;
  group.userData.disposableMaterials = [panelMaterial];
  return group;
}

function spawnGateGroup() {
  if (questionState.complete) return;
  const question = GAME_1_QUESTIONS[questionState.index];
  const options = shuffled([
    { text: question.correct, correct: true },
    ...question.distractors.map(text => ({ text, correct: false })),
  ]);
  questionState.attemptId += 1;
  questionState.activeAttempt = { id: questionState.attemptId, resolved: false };
  const taskType = questionState.index < 8 ? "CHOOSE THE CORRECT FORM" : "CHOOSE THE TIME MARKER";
  questionProgress.textContent = `PAST OR EXPERIENCE? · ${taskType} · ${questionState.index + 1}/15`;
  questionText.textContent = question.sentence;
  questionPanel.hidden = false;
  options.forEach((option, lane) => addEntity({
    group: createGate(option.text),
    kind: "gate",
    lane,
    label: option.text,
    correct: option.correct,
    attemptId: questionState.attemptId,
  }));
}

const state = {
  lane: 1,
  playerX: 0,
  playerWorldX: CONFIG.laneX[1],
  laneScreenX: [0, 0, 0],
  jumpTime: 0,
  lastTime: performance.now(),
  score: 0,
  stars: 0,
  lives: MAX_LIVES,
  correctAnswers: 0,
  wrongAnswers: 0,
  invulnerableUntil: 0,
  timers: { event: 0.35, gate: 10 },
};

const gameplayFlow = {
  recentTypes: [],
  timeSinceObstacle: 2,
  extraLifeCooldown: 10 + Math.random() * 8,
  heartLaneCounts: [0, 0, 0],
};

function chooseGameplayEventType() {
  const recent = gameplayFlow.recentTypes;
  const repeatedTwice = recent.length >= 2 && recent.at(-1) === recent.at(-2);
  const weighted = ["star", "star", "star", "obstacle", "obstacle", "obstacle", "obstacle", "mix", "mix"];
  if (gameplayFlow.extraLifeCooldown <= -2) {
    recent.push("life");
    if (recent.length > 4) recent.shift();
    return "life";
  }
  if (gameplayFlow.extraLifeCooldown <= 0) weighted.push("life", "life", "life", "life");
  const choices = repeatedTwice ? weighted.filter(type => type !== recent.at(-1)) : weighted;
  const type = choices[Math.floor(Math.random() * choices.length)];
  recent.push(type);
  if (recent.length > 4) recent.shift();
  return type;
}

function spawnGameplayEvent(type) {
  if (type === "star") {
    spawnStarChain();
    return;
  }
  if (type === "life") {
    const lane = spawnExtraLife();
    if (Math.random() < 0.48) {
      spawnStarChain({ forcedLane: lane, startZ: GAMEPLAY_Z + 13, length: 2, spacing: 6 });
      spawnStarChain({ forcedLane: lane, startZ: GAMEPLAY_Z - 7, length: 1, spacing: 6 });
    }
    gameplayFlow.extraLifeCooldown = 10 + Math.random() * 8;
    return;
  }
  const formation = spawnObstaclePattern(Math.max(0.7, gameplayFlow.timeSinceObstacle));
  gameplayFlow.timeSinceObstacle = 0;
  if (type === "mix") {
    const emptyLanes = [0, 1, 2].filter(lane => !formation.blockedLanes.includes(lane));
    const guideLanes = emptyLanes.length ? emptyLanes : formation.routeLanes;
    const guideLane = guideLanes[Math.floor(Math.random() * guideLanes.length)];
    spawnStarChain({ forcedLane: guideLane, startZ: GAMEPLAY_Z + 16, length: 3, spacing: 5.5 });
  }
}

const scoreLabel = document.querySelector("#score");
const starsLabel = document.querySelector("#stars");
const lifeSlots = [...document.querySelectorAll("#life-slots img")];
const lifeSlotsContainer = document.querySelector("#life-slots");
const eventMessage = document.querySelector("#event-message");
const questionPanel = document.querySelector("#question-panel");
const questionProgress = document.querySelector("#question-progress");
const questionText = document.querySelector("#question-text");
const pauseButton = document.querySelector("#pause-button");
const pauseOverlay = document.querySelector("#pause-overlay");
const failedOverlay = document.querySelector("#failed-overlay");
const continueButton = document.querySelector("#continue-button");
const restartButton = document.querySelector("#restart-button");
const homeButton = document.querySelector("#home-button");
const startOverlay = document.querySelector("#start-overlay");
const resultsOverlay = document.querySelector("#results-overlay");
const playButton = document.querySelector("#play-button");
const rulesButton = document.querySelector("#rules-button");
const rulesBackButton = document.querySelector("#rules-back-button");
const titleScreenView = document.querySelector("#title-screen-view");
const titleScreenImage = document.querySelector("#title-screen-image");
const rulesScreenView = document.querySelector("#rules-screen-view");
const playAgainButton = document.querySelector("#play-again-button");
const resultsHomeButton = document.querySelector("#results-home-button");
const resultScore = document.querySelector("#result-score");
const resultStars = document.querySelector("#result-stars");
const resultCorrect = document.querySelector("#result-correct");
const resultMistakes = document.querySelector("#result-mistakes");
const resultLives = document.querySelector("#result-lives");
const performanceMessage = document.querySelector("#performance-message");

const runtime = {
  mode: "start",
  pausedAt: 0,
  failedUntil: 0,
  finishUntil: 0,
};

const MUSIC_MASTER_MULTIPLIER = 0.08;
const SFX_MASTER_MULTIPLIER = 0.15;

class AudioManager {
  constructor() {
    const saved = this.loadSettings();
    this.musicVolume = saved.musicVolume;
    this.sfxVolume = saved.sfxVolume;
    this.muted = saved.muted;
    this.unavailable = new Set();
    this.music = new Audio("assets/sounds/music_game2.mp3");
    this.music.loop = true;
    this.music.preload = "auto";
    this.music.volume = this.muted ? 0 : this.musicVolume * MUSIC_MASTER_MULTIPLIER;
    this.music.addEventListener("error", () => this.unavailable.add("music"), { once: true });
    this.sfx = Object.fromEntries(Object.entries({
      star: "assets/sounds/star_collect.wav",
      life: "assets/sounds/extra_life.wav",
      collision: "assets/sounds/collision.wav",
      gate: "assets/sounds/gate_select.wav",
      jump: "assets/sounds/jump.wav",
    }).map(([name, path]) => {
      const audio = new Audio(path);
      audio.preload = "auto";
      audio.volume = this.sfxVolume * SFX_MASTER_MULTIPLIER;
      audio.addEventListener("error", () => this.unavailable.add(name), { once: true });
      return [name, audio];
    }));
    this.music.load();
    for (const sound of Object.values(this.sfx)) sound.load();
    this.unlocked = false;
  }

  loadSettings() {
    const defaults = { musicVolume: 0.12, sfxVolume: 0.30, muted: false };
    try {
      const saved = JSON.parse(localStorage.getItem("tenseRushAudioSettingsV3"));
      if (!saved) return defaults;
      return {
        musicVolume: Math.max(0, Math.min(1, Number(saved.musicVolume) || 0)),
        sfxVolume: Math.max(0, Math.min(1, Number(saved.sfxVolume) || 0)),
        muted: Boolean(saved.muted),
      };
    } catch {
      return defaults;
    }
  }

  saveSettings() {
    try {
      localStorage.setItem("tenseRushAudioSettingsV3", JSON.stringify({
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        muted: this.muted,
      }));
    } catch {}
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.music.volume = this.muted ? 0 : this.musicVolume * MUSIC_MASTER_MULTIPLIER;
    this.saveSettings();
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    for (const sound of Object.values(this.sfx)) sound.volume = this.sfxVolume * SFX_MASTER_MULTIPLIER;
    this.saveSettings();
  }

  setMuted(muted) {
    this.muted = muted;
    this.music.volume = this.muted ? 0 : this.musicVolume * MUSIC_MASTER_MULTIPLIER;
    this.saveSettings();
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    for (const sound of Object.values(this.sfx)) {
      const warmup = sound.cloneNode();
      warmup.muted = true;
      warmup.play().then(() => {
        warmup.pause();
        warmup.currentTime = 0;
      }).catch(() => {});
    }
    if (!this.unavailable.has("music")) this.music.play().catch(() => {});
  }

  play(name) {
    if (!this.unlocked || this.muted || this.unavailable.has(name) || !this.sfx[name]) return;
    const sound = this.sfx[name].cloneNode();
    sound.volume = this.sfxVolume * SFX_MASTER_MULTIPLIER;
    sound.addEventListener("error", () => this.unavailable.add(name), { once: true });
    sound.play().catch(() => {});
  }

  pauseForGame() {
    this.music.pause();
  }

  resumeForGame() {
    if (this.unlocked && !this.muted && !this.unavailable.has("music")) this.music.play().catch(() => {});
  }
}

const audioManager = new AudioManager();
const musicVolumeControl = document.querySelector("#music-volume");
const effectsVolumeControl = document.querySelector("#effects-volume");
const muteButton = document.querySelector("#mute-button");
const pauseMusicVolumeControl = document.querySelector("#pause-music-volume");
const pauseEffectsVolumeControl = document.querySelector("#pause-effects-volume");
const pauseMuteButton = document.querySelector("#pause-mute-button");

function updateSoundControls() {
  for (const control of [musicVolumeControl, pauseMusicVolumeControl]) control.value = Math.round(audioManager.musicVolume * 100);
  for (const control of [effectsVolumeControl, pauseEffectsVolumeControl]) control.value = Math.round(audioManager.sfxVolume * 100);
  muteButton.textContent = audioManager.muted ? "🔇" : "🔊";
  muteButton.classList.toggle("muted", audioManager.muted);
  muteButton.setAttribute("aria-pressed", String(audioManager.muted));
  muteButton.setAttribute("aria-label", audioManager.muted ? "Unmute all sound" : "Mute all sound");
  pauseMuteButton.textContent = audioManager.muted ? "🔇 SOUND OFF" : "🔊 SOUND ON";
  pauseMuteButton.setAttribute("aria-pressed", String(audioManager.muted));
}

for (const control of [musicVolumeControl, pauseMusicVolumeControl]) {
  control.addEventListener("input", event => {
    if (runtime.mode === "running") audioManager.unlock();
    audioManager.setMusicVolume(Number(event.target.value) / 100);
    updateSoundControls();
  });
}
for (const control of [effectsVolumeControl, pauseEffectsVolumeControl]) {
  control.addEventListener("input", event => {
    if (runtime.mode === "running") audioManager.unlock();
    audioManager.setSfxVolume(Number(event.target.value) / 100);
    updateSoundControls();
  });
}
for (const button of [muteButton, pauseMuteButton]) {
  button.addEventListener("click", () => {
    if (runtime.mode === "running") audioManager.unlock();
    audioManager.setMuted(!audioManager.muted);
    updateSoundControls();
  });
}
updateSoundControls();

function resize() {
  const width = game.clientWidth;
  const height = game.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  updateLaneScreenPositions();
  layoutTitleHitboxes();
}

function layoutTitleHitboxes() {
  const width = titleScreenView.clientWidth;
  const height = titleScreenView.clientHeight;
  const sourceWidth = titleScreenImage.naturalWidth || 1536;
  const sourceHeight = titleScreenImage.naturalHeight || 1024;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const offsetX = (width - sourceWidth * scale) / 2;
  const offsetY = (height - sourceHeight * scale) / 2;
  const areas = [
    [playButton, { x: 595, y: 649, width: 367, height: 86 }],
    [rulesButton, { x: 595, y: 747, width: 367, height: 88 }],
  ];
  for (const [button, area] of areas) {
    button.style.left = `${offsetX + area.x * scale}px`;
    button.style.top = `${offsetY + area.y * scale}px`;
    button.style.width = `${area.width * scale}px`;
    button.style.height = `${area.height * scale}px`;
  }
}

titleScreenImage.addEventListener("load", layoutTitleHitboxes);

function updateLaneScreenPositions() {
  state.laneScreenX = CONFIG.laneX.map(x => {
    const point = new THREE.Vector3(x, 0, CONFIG.playerRoadZ).project(camera);
    return (point.x * 0.5 + 0.5) * game.clientWidth;
  });
  if (!state.playerX) state.playerX = state.laneScreenX[1];
}

function updateRoad(dt) {
  const loopLength = CONFIG.segmentLength * CONFIG.segmentCount;
  for (const segment of roadSegments) {
    segment.position.z += CONFIG.speed * dt;
    if (segment.position.z > CONFIG.segmentLength) segment.position.z -= loopLength;
  }
}

function jumpHeight() {
  if (state.jumpTime <= 0) return 0;
  const progress = 1 - state.jumpTime / CONFIG.jumpDuration;
  return Math.sin(progress * Math.PI) * game.clientHeight * 0.16;
}

function updatePlayer(dt) {
  const targetX = state.laneScreenX[state.lane];
  state.playerX += (targetX - state.playerX) * (1 - Math.exp(-dt * 9));
  state.playerWorldX += (CONFIG.laneX[state.lane] - state.playerWorldX) * (1 - Math.exp(-dt * 9));
  if (state.jumpTime > 0) state.jumpTime = Math.max(0, state.jumpTime - dt);
  const direction = targetX - state.playerX;
  player.style.setProperty("--x", `${state.playerX}px`);
  player.style.setProperty("--jump", `${-jumpHeight()}px`);
  player.style.setProperty("--tilt", `${Math.max(-7, Math.min(7, direction * 0.035))}deg`);
}

function currentJumpRatio() {
  if (state.jumpTime <= 0) return 0;
  const progress = 1 - state.jumpTime / CONFIG.jumpDuration;
  return Math.sin(progress * Math.PI);
}

function showEvent(message, tone = "") {
  eventMessage.textContent = message;
  eventMessage.classList.remove("show", "correct", "wrong", "missed");
  if (tone) eventMessage.classList.add(tone);
  void eventMessage.offsetWidth;
  eventMessage.classList.add("show");
}

function removeEntity(entity) {
  scene.remove(entity.group);
  entity.group.traverse(child => {
    if (child.material?.map?.isCanvasTexture) child.material.map.dispose();
    if (child.material?.map?.isCanvasTexture) child.material.dispose();
  });
  for (const material of entity.group.userData.disposableMaterials ?? []) material.dispose();
  const index = gameplayEntities.indexOf(entity);
  if (index >= 0) gameplayEntities.splice(index, 1);
}

function highlightGate(entity, color) {
  const material = entity.group.userData.panelMaterial;
  if (!material) return;
  material.color.setHex(color);
  material.opacity = 0.76;
}

function resolveQuestionAttempt(outcome, selectedGate, now) {
  const attempt = questionState.activeAttempt;
  if (!attempt || attempt.resolved) return;
  attempt.resolved = true;

  if (selectedGate) {
    selectedGate.resolved = true;
    highlightGate(selectedGate, outcome === "correct" ? 0x35df68 : 0xff4938);
    for (const gate of [...gameplayEntities]) {
      if (gate.kind === "gate" && gate !== selectedGate) removeEntity(gate);
    }
    audioManager.play("gate");
  } else {
    for (const gate of [...gameplayEntities]) if (gate.kind === "gate") removeEntity(gate);
  }

  if (outcome === "correct") {
    state.score += 100;
    state.correctAnswers += 1;
    questionState.index += 1;
    if (questionState.index >= GAME_1_QUESTIONS.length) {
      questionState.complete = true;
      questionState.pendingCompleteMessage = true;
      enterCompletionState(now);
    }
    showEvent("CORRECT!", "correct");
  } else if (outcome === "wrong") {
    state.score -= 50;
    state.wrongAnswers += 1;
    showEvent("WRONG!", "wrong");
  } else {
    showEvent("MISSED!", "missed");
  }

  questionState.selectedGate = selectedGate;
  questionState.feedbackUntil = now + 900;
}

function updateQuestionFeedback(now) {
  if (!questionState.feedbackUntil || now < questionState.feedbackUntil) return;
  for (const gate of [...gameplayEntities]) if (gate.kind === "gate") removeEntity(gate);
  questionPanel.hidden = true;
  questionState.activeAttempt = null;
  questionState.selectedGate = null;
  questionState.feedbackUntil = 0;
  state.timers.event = 0.05;
  if (questionState.pendingCompleteMessage) {
    questionState.pendingCompleteMessage = false;
    showEvent("TENSE RUSH COMPLETE!", "correct");
  }
}

function updateHud() {
  scoreLabel.textContent = state.score;
  starsLabel.textContent = state.stars;
  lifeSlots.forEach((heart, index) => heart.classList.toggle("empty", index >= state.lives));
  lifeSlotsContainer.setAttribute("aria-label", `${state.lives} of 5 lives`);
}

function resetRun() {
  for (const entity of [...gameplayEntities]) removeEntity(entity);
  state.lane = 1;
  state.playerX = state.laneScreenX[1] || game.clientWidth / 2;
  state.playerWorldX = CONFIG.laneX[1];
  state.jumpTime = 0;
  state.score = 0;
  state.stars = 0;
  state.lives = MAX_LIVES;
  state.correctAnswers = 0;
  state.wrongAnswers = 0;
  state.invulnerableUntil = 0;
  state.timers.event = 0.35;
  state.timers.gate = 10;
  state.lastTime = performance.now();

  gameplayFlow.recentTypes.length = 0;
  gameplayFlow.timeSinceObstacle = 2;
  gameplayFlow.extraLifeCooldown = 10 + Math.random() * 8;
  gameplayFlow.heartLaneCounts.fill(0);
  obstacleSpawnState.laneCounts.fill(0);
  obstacleSpawnState.safeLaneCounts.fill(0);
  obstacleSpawnState.recentSingleLanes.length = 0;
  obstacleSpawnState.typeBag.length = 0;
  obstacleSpawnState.previousRoutes = [1];
  obstacleSpawnState.nextGap = 1.15;
  obstacleSpawnState.lowIndex = 0;
  obstacleSpawnState.highIndex = 0;
  obstacleSpawnState.previousRequiredJump = false;

  questionState.index = 0;
  questionState.attemptId = 0;
  questionState.activeAttempt = null;
  questionState.feedbackUntil = 0;
  questionState.selectedGate = null;
  questionState.complete = false;
  questionState.pendingCompleteMessage = false;

  questionPanel.hidden = true;
  questionProgress.textContent = "NOW OR USUALLY? · 1/15";
  questionText.textContent = "";
  eventMessage.textContent = "";
  eventMessage.classList.remove("show", "correct", "wrong", "missed");
  player.classList.remove("hit");
  laneLabel.textContent = "CENTER";
  pauseButton.disabled = false;
  updateHud();
}

function startFreshRun() {
  resetRun();
  runtime.mode = "running";
  runtime.finishUntil = 0;
  startOverlay.hidden = true;
  titleScreenView.hidden = false;
  rulesScreenView.hidden = true;
  resultsOverlay.hidden = true;
  pauseOverlay.hidden = true;
  failedOverlay.hidden = true;
  pauseButton.hidden = false;
  game.classList.remove("in-start", "is-paused", "is-failed");
  audioManager.unlock();
  audioManager.resumeForGame();
}

function returnToStart() {
  resetRun();
  runtime.mode = "start";
  runtime.pausedAt = 0;
  runtime.finishUntil = 0;
  pauseOverlay.hidden = true;
  resultsOverlay.hidden = true;
  failedOverlay.hidden = true;
  startOverlay.hidden = false;
  titleScreenView.hidden = false;
  rulesScreenView.hidden = true;
  pauseButton.hidden = true;
  game.classList.remove("is-paused", "is-failed");
  game.classList.add("in-start");
  audioManager.pauseForGame();
}

function showRulesScreen() {
  if (runtime.mode !== "start") return;
  titleScreenView.hidden = true;
  rulesScreenView.hidden = false;
}

function showTitleScreen() {
  if (runtime.mode !== "start") return;
  rulesScreenView.hidden = true;
  titleScreenView.hidden = false;
}

function enterCompletionState(now) {
  if (runtime.mode !== "running") return;
  runtime.mode = "finishing";
  runtime.finishUntil = now + 2600;
  pauseButton.disabled = true;
  for (const entity of [...gameplayEntities]) {
    if (entity.kind !== "gate") removeEntity(entity);
  }
}

function showResults() {
  runtime.mode = "completed";
  runtime.finishUntil = 0;
  pauseButton.hidden = true;
  questionPanel.hidden = true;
  resultScore.textContent = state.score;
  resultStars.textContent = state.stars;
  resultCorrect.textContent = `${state.correctAnswers} / 15`;
  resultMistakes.textContent = state.wrongAnswers;
  resultLives.textContent = `${state.lives} / ${MAX_LIVES}`;
  performanceMessage.textContent = state.wrongAnswers === 0
    ? "PERFECT RUN!"
    : state.wrongAnswers <= 3
      ? "GREAT JOB!"
      : state.wrongAnswers <= 6
        ? "NICE WORK!"
        : "KEEP PRACTICING!";
  resultsOverlay.hidden = false;
  audioManager.pauseForGame();
}

function pauseGame() {
  if (runtime.mode !== "running") return;
  runtime.mode = "paused";
  runtime.pausedAt = performance.now();
  pauseOverlay.hidden = false;
  game.classList.add("is-paused");
  audioManager.pauseForGame();
}

function continueGame() {
  if (runtime.mode !== "paused") return;
  const now = performance.now();
  const pausedDuration = now - runtime.pausedAt;
  if (questionState.feedbackUntil) questionState.feedbackUntil += pausedDuration;
  if (state.invulnerableUntil) state.invulnerableUntil += pausedDuration;
  runtime.mode = "running";
  runtime.pausedAt = 0;
  state.lastTime = now;
  pauseOverlay.hidden = true;
  game.classList.remove("is-paused");
  audioManager.resumeForGame();
}

function restartFromPause() {
  if (runtime.mode !== "paused") return;
  resetRun();
  runtime.mode = "running";
  runtime.pausedAt = 0;
  pauseOverlay.hidden = true;
  game.classList.remove("is-paused");
  audioManager.resumeForGame();
}

function enterFailedState(now) {
  if (runtime.mode !== "running") return;
  runtime.mode = "failed";
  runtime.failedUntil = now + 1800;
  failedOverlay.hidden = false;
  pauseButton.disabled = true;
  game.classList.add("is-failed");
  audioManager.pauseForGame();
}

function finishFailedRestart() {
  resetRun();
  runtime.mode = "running";
  runtime.failedUntil = 0;
  failedOverlay.hidden = true;
  game.classList.remove("is-failed");
  audioManager.resumeForGame();
}

function updateGameplay(dt, now) {
  updateQuestionFeedback(now);
  const gatesActive = gameplayEntities.some(entity => entity.kind === "gate");
  state.timers.event -= dt;
  state.timers.gate -= dt;
  gameplayFlow.timeSinceObstacle += dt;
  gameplayFlow.extraLifeCooldown -= dt;

  const gateApproachClear = questionState.complete || state.timers.gate > 5.5;
  if (state.timers.event <= 0 && !gatesActive && !questionState.feedbackUntil && gateApproachClear) {
    spawnGameplayEvent(chooseGameplayEventType());
    state.timers.event = 0.55 + Math.random() * 0.5;
  }
  if (state.timers.gate <= 0 && !gatesActive && !questionState.feedbackUntil && !questionState.complete) {
    spawnGateGroup();
    state.timers.gate = 15;
    state.timers.event = 0.05;
  }

  const collisionRange = 1.65;
  for (const entity of [...gameplayEntities]) {
    if (!gameplayEntities.includes(entity)) continue;
    entity.group.position.z += CONFIG.speed * dt;
    if (entity.kind === "star" || entity.kind === "life") {
      entity.group.position.y += Math.sin(now * 0.004 + entity.lane) * dt * 0.16;
    }

    const atPlayerDepth = Math.abs(entity.group.position.z - PLAYER_COLLISION_Z) < collisionRange;
    const sameLane = Math.abs(entity.group.position.x - state.playerWorldX) < 2.05;
    if (!entity.resolved && atPlayerDepth && sameLane) {
      if (entity.kind === "star") {
        entity.resolved = true;
        state.score += 10;
        state.stars += 1;
        audioManager.play("star");
        removeEntity(entity);
        continue;
      }
      if (entity.kind === "life") {
        entity.resolved = true;
        if (state.lives < MAX_LIVES) state.lives += 1;
        else state.score += 100;
        audioManager.play("life");
        removeEntity(entity);
        continue;
      }
      if (entity.kind === "gate") {
        resolveQuestionAttempt(entity.correct ? "correct" : "wrong", entity, now);
        continue;
      }
      if (entity.kind === "obstacle" && now >= state.invulnerableUntil) {
        const jumpedLowObstacle = entity.low && currentJumpRatio() > 0.38;
        if (!jumpedLowObstacle) {
          entity.resolved = true;
          state.lives = Math.max(0, state.lives - 1);
          state.invulnerableUntil = now + 1500;
          audioManager.play("collision");
          player.classList.remove("hit");
          void player.offsetWidth;
          player.classList.add("hit");
          if (state.lives === 0) {
            enterFailedState(now);
            break;
          }
        }
      }
    }

    if (entity.kind === "gate"
      && !questionState.activeAttempt?.resolved
      && entity.group.position.z > PLAYER_COLLISION_Z + collisionRange) {
      resolveQuestionAttempt("missed", null, now);
      continue;
    }

    if (entity.group.position.z > CONFIG.cameraZ + 12) removeEntity(entity);
  }

  updateHud();
}

function moveLane(direction) {
  if (runtime.mode !== "running") return;
  state.lane = Math.max(0, Math.min(2, state.lane + direction));
  laneLabel.textContent = ["LEFT", "CENTER", "RIGHT"][state.lane];
}

function jump() {
  if (runtime.mode !== "running") return;
  if (state.jumpTime <= 0) {
    state.jumpTime = CONFIG.jumpDuration;
    audioManager.play("jump");
  }
}

window.addEventListener("keydown", event => {
  if (event.code === "Escape") {
    event.preventDefault();
    if (event.repeat || runtime.mode === "failed") return;
    if (runtime.mode === "paused") continueGame();
    else pauseGame();
    return;
  }
  if (runtime.mode !== "running") return;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) audioManager.unlock();
  if (event.repeat && (event.code === "ArrowLeft" || event.code === "ArrowRight")) return;
  if (event.code === "ArrowLeft") moveLane(-1);
  if (event.code === "ArrowRight") moveLane(1);
  if (event.code === "ArrowUp" || event.code === "Space") jump();
  help.style.opacity = "0.25";
}, { passive: false });

pauseButton.addEventListener("click", pauseGame);
continueButton.addEventListener("click", continueGame);
restartButton.addEventListener("click", restartFromPause);
homeButton.addEventListener("click", returnToStart);
playButton.addEventListener("click", startFreshRun);
rulesButton.addEventListener("click", showRulesScreen);
rulesBackButton.addEventListener("click", showTitleScreen);
playAgainButton.addEventListener("click", startFreshRun);
resultsHomeButton.addEventListener("click", returnToStart);

window.addEventListener("resize", resize);
resize();

function frame(now) {
  const dt = Math.min((now - state.lastTime) / 1000, 0.05);
  state.lastTime = now;
  if (runtime.mode === "running") {
    updateRoad(dt);
    updatePlayer(dt);
    updateGameplay(dt, now);
  } else if (runtime.mode === "finishing") {
    updateRoad(dt);
    updatePlayer(dt);
    updateQuestionFeedback(now);
    if (now >= runtime.finishUntil) showResults();
  } else if (runtime.mode === "failed" && now >= runtime.failedUntil) {
    finishFailedRestart();
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
