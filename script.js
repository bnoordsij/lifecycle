import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const total = Math.PI * 2;
const helixRadius = 0.9;
const helixLength = 4.7;
const circleRadius = 0.86;
const circleCenter = new THREE.Vector3(0, 0, 0);
const springScene = new THREE.Scene();
const circleScene = new THREE.Scene();
const springModel = new THREE.Group();
springModel.rotation.x = -Math.PI / 2;
springScene.add(springModel);
const springCanvas = document.querySelector('#springScene');
const circleCanvas = document.querySelector('#circleScene');
const springPanel = springCanvas.parentElement;
const circlePanel = circleCanvas.parentElement;
const springCamera = new THREE.OrthographicCamera(-3.2, 3.2, 2, -2, 0.1, 50);
springCamera.position.set(0, 0, 8);
springCamera.lookAt(0, 0, 0);
const circleCamera = new THREE.OrthographicCamera(-1.9, 1.9, 1.9, -1.9, 0.1, 50);
circleCamera.position.set(0, 0, 8);
circleCamera.lookAt(0, 0, 0);
const springRenderer = new THREE.WebGLRenderer({ canvas: springCanvas, antialias: true, alpha: true });
const circleRenderer = new THREE.WebGLRenderer({ canvas: circleCanvas, antialias: true, alpha: true });
for (const renderer of [springRenderer, circleRenderer]) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}
const springControls = new OrbitControls(springCamera, springRenderer.domElement);
springControls.enableDamping = true;
springControls.dampingFactor = 0.08;
springControls.enablePan = false;
springControls.enableZoom = false;
springControls.minPolarAngle = Math.PI * 0.4;
springControls.maxPolarAngle = Math.PI * 0.6;
springControls.target.set(0, 0, 0);
springControls.update();

const springLight = new THREE.HemisphereLight(0xcbd5ff, 0x24283a, 2.1);
const springKey = new THREE.DirectionalLight(0xffffff, 2.5);
springKey.position.set(1, 4, 6);
springScene.add(springLight, springKey);
const circleLight = new THREE.HemisphereLight(0xcbd5ff, 0x24283a, 2.1);
const circleKey = new THREE.DirectionalLight(0xffffff, 2.4);
circleKey.position.set(2, 3, 5);
circleScene.add(circleLight, circleKey);
const material = (color, roughness = 0.42) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.12 });
const springMaterial = material('#a5b4fc', 0.27);
const tanMaterial = material('#f083a5');
const dimLine = new THREE.LineBasicMaterial({ color: '#626b7e', transparent: true, opacity: 0.62 });

function line(scene, points, material) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const object = new THREE.Line(geometry, material);
  scene.add(object);
  return object;
}
function dynamicLine(scene, color) {
  return line(scene, [new THREE.Vector3(), new THREE.Vector3()], new THREE.LineBasicMaterial({ color }));
}
function setLine(object, start, end) { object.geometry.setFromPoints([start, end]); }
function textSprite(scene, text, position, color, width = 0.9, height = 0.32) {
  const textCanvas = document.createElement('canvas');
  textCanvas.width = 384; textCanvas.height = 128;
  const context = textCanvas.getContext('2d');
  context.font = '600 42px system-ui, sans-serif';
  context.fillStyle = color;
  context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText(text, 192, 64);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(textCanvas), transparent: true, depthTest: false }));
  sprite.position.copy(position);
  sprite.scale.set(width, height, 1);
  scene.add(sprite);
  return sprite;
}

// Keep the spring axis horizontal and rotate its traces together so cosine faces the camera.
const springPoint = (angle) => new THREE.Vector3(
  -helixLength / 2 + helixLength * angle / total,
  helixRadius * Math.sin(angle),
  helixRadius * Math.cos(angle)
);
const springPoints = Array.from({ length: 361 }, (_, index) => springPoint(total * index / 360));
springModel.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPoints), 480, 0.046, 12, false), springMaterial));
const sineTracePoints = Array.from({ length: 361 }, (_, index) => {
  const angle = total * index / 360;
  const point = springPoint(angle);
  return new THREE.Vector3(point.x, point.y, 0);
});
const sineTrace = new THREE.Mesh(
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sineTracePoints), 480, 0.024, 8, false),
  new THREE.MeshBasicMaterial({ color: '#f4b860' })
);
springModel.add(sineTrace);
const cosineTracePoints = Array.from({ length: 361 }, (_, index) => {
  const point = springPoint(total * index / 360);
  return new THREE.Vector3(point.x, 0, point.z);
});
const cosineTrace = new THREE.Mesh(
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cosineTracePoints), 480, 0.024, 8, false),
  new THREE.MeshBasicMaterial({ color: '#65d6c1' })
);
springModel.add(cosineTrace);
const secantScale = helixRadius;
const secantLimit = 2;
const secantSegments = [];
let secantSegment = [];
for (let index = 0; index <= 720; index++) {
  const angle = total * index / 720;
  const cosine = Math.cos(angle);
  const secant = 1 / cosine;
  if (Math.abs(secant) <= secantLimit) {
    const x = -helixLength / 2 + helixLength * angle / total;
    secantSegment.push(new THREE.Vector3(x, 0, secantScale * secant));
  } else {
    if (secantSegment.length > 1) secantSegments.push(secantSegment);
    secantSegment = [];
  }
}
if (secantSegment.length > 1) secantSegments.push(secantSegment);
const secantMaterial = new THREE.MeshBasicMaterial({ color: '#c084fc' });
for (const points of secantSegments) {
  const curve = new THREE.CatmullRomCurve3(points);
  const trace = new THREE.Mesh(new THREE.TubeGeometry(curve, points.length * 2, 0.024, 8, false), secantMaterial);
  springModel.add(trace);
}
line(springModel, [new THREE.Vector3(-2.65, 0, 0), new THREE.Vector3(2.65, 0, 0)], dimLine);
const endMaterial = material('#d9def1', 0.25);
for (const end of [springPoints[0], springPoints[springPoints.length - 1]]) {
  const endpoint = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), endMaterial);
  endpoint.position.copy(end);
  springModel.add(endpoint);
}
const springMarker = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), material('#ffffff', 0.2));
springModel.add(springMarker);

// The circle stays fixed while the spring has its own independent orbit controls.
const ringPoints = Array.from({ length: 129 }, (_, index) => {
  const angle = total * index / 128;
  return new THREE.Vector3(circleRadius * Math.cos(angle), circleRadius * Math.sin(angle), 0);
});
line(circleScene, ringPoints, new THREE.LineBasicMaterial({ color: '#9aa2b5', transparent: true, opacity: 0.88 }));
line(circleScene, [new THREE.Vector3(-1.35, 0, 0), new THREE.Vector3(1.65, 0, 0)], dimLine);
line(circleScene, [new THREE.Vector3(0, -1.38, 0), new THREE.Vector3(0, 1.48, 0)], dimLine);
textSprite(circleScene, 'cos θ', new THREE.Vector3(1.4, -0.17, 0), '#65d6c1', 0.8, 0.28);
textSprite(circleScene, 'sin θ', new THREE.Vector3(-0.18, 1.58, 0), '#f4b860', 0.8, 0.28);
const radiusLine = dynamicLine(circleScene, '#a5b4fc');
const cosineLine = dynamicLine(circleScene, '#65d6c1');
const sineLine = dynamicLine(circleScene, '#f4b860');
const tangentLine = dynamicLine(circleScene, '#f083a5');
const circleMarker = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), material('#ffffff', 0.2));
const tangentMarker = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 12), tanMaterial);
circleScene.add(circleMarker, tangentMarker);

const graphSpecs = [
  { id: 'sinGraph', name: 'sin', color: '#f4b860', range: 1.2, fn: Math.sin },
  { id: 'cosGraph', name: 'cos', color: '#65d6c1', range: 1.2, fn: Math.cos },
  { id: 'tanGraph', name: 'tan', color: '#f083a5', range: 3.15, fn: Math.tan }
];
const plot = { left: 25, right: 395, top: 10, bottom: 112 };
function graphY(value, range) { return (plot.top + plot.bottom) / 2 - value / range * ((plot.bottom - plot.top) / 2); }
function graphX(angle) { return plot.left + angle / total * (plot.right - plot.left); }
function prepareGraph(spec) {
  const svg = document.querySelector(`#${spec.id}`);
  const half = (plot.bottom - plot.top) / 2;
  let markup = '';
  for (let tick = -2; tick <= 2; tick++) {
    const y = (plot.top + plot.bottom) / 2 - tick * half / 2;
    markup += `<line class="grid-line" x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}"/>`;
  }
  const labels = ['0', 'π/2', 'π', '3π/2', '2π'];
  for (let tick = 0; tick <= 4; tick++) {
    const x = graphX(total * tick / 4);
    markup += `<line class="grid-line" x1="${x}" y1="${plot.top}" x2="${x}" y2="${plot.bottom}"/>`;
    markup += `<text class="tick-label" x="${x}" y="132" text-anchor="middle">${labels[tick]}</text>`;
  }
  markup += `<line class="axis-line" x1="${plot.left}" y1="${graphY(0, spec.range)}" x2="${plot.right}" y2="${graphY(0, spec.range)}"/>`;
  let path = '';
  let penDown = false;
  let previousValue = 0;
  const samples = 720;
  for (let index = 0; index <= samples; index++) {
    const angle = total * index / samples;
    const value = spec.fn(angle);
    const clipped = !Number.isFinite(value) || Math.abs(value) > spec.range;
    const jump = penDown && Math.abs(value - previousValue) > spec.range;
    if (clipped || jump) { penDown = false; continue; }
    path += `${penDown ? 'L' : 'M'}${graphX(angle).toFixed(2)},${graphY(value, spec.range).toFixed(2)} `;
    penDown = true;
    previousValue = value;
  }
  markup += `<path class="curve" stroke="${spec.color}" d="${path}"/>`;
  markup += `<line class="cursor" x1="${plot.left}" y1="${plot.top}" x2="${plot.left}" y2="${plot.bottom}"/>`;
  markup += `<circle class="graph-dot" cx="${plot.left}" cy="${graphY(0, spec.range)}" r="5" fill="${spec.color}"/>`;
  svg.innerHTML = markup;
  return { spec, cursor: svg.querySelector('.cursor'), dot: svg.querySelector('.graph-dot') };
}
const graphs = graphSpecs.map(prepareGraph);

const angleValue = document.querySelector('#angle');
const cosValue = document.querySelector('#cos');
const sinValue = document.querySelector('#sin');
const tanValue = document.querySelector('#tan');
const slider = document.querySelector('#slider');
const playButton = document.querySelector('#play');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let angle = 0;
let playing = !reducedMotion;
let previousTime = 0;

function update(nextAngle) {
  angle = Math.abs(nextAngle - total) < 1e-8 ? total : THREE.MathUtils.euclideanModulo(nextAngle, total);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const isAsymptote = Math.abs(cosine) < 0.015;
  const tangent = isAsymptote ? null : sine / cosine;
  const circlePoint = new THREE.Vector3(circleRadius * cosine, circleRadius * sine, 0);
  springMarker.position.copy(springPoint(angle));
  circleMarker.position.copy(circlePoint);
  setLine(radiusLine, circleCenter, circlePoint);
  setLine(cosineLine, circleCenter, new THREE.Vector3(circleRadius * cosine, 0, 0));
  setLine(sineLine, new THREE.Vector3(circleRadius * cosine, 0, 0), circlePoint);
  if (tangent === null) {
    tangentLine.visible = false;
    tangentMarker.visible = false;
    tanValue.textContent = 'undefined';
  } else {
    const clippedTangent = THREE.MathUtils.clamp(tangent, -1.9, 1.9);
    const tangentEnd = new THREE.Vector3(circleRadius, circleRadius * clippedTangent, 0);
    setLine(tangentLine, new THREE.Vector3(circleRadius, 0, 0), tangentEnd);
    tangentLine.visible = true;
    tangentMarker.position.copy(tangentEnd);
    tangentMarker.visible = Math.abs(tangent) <= 1.9;
    tanValue.textContent = Math.abs(tangent) > 999 ? 'undefined' : tangent.toFixed(3);
  }
  for (const graph of graphs) {
    const value = graph.spec.fn(angle);
    graph.cursor.setAttribute('x1', graphX(angle));
    graph.cursor.setAttribute('x2', graphX(angle));
    const visible = Number.isFinite(value) && Math.abs(value) <= graph.spec.range;
    graph.dot.setAttribute('cx', graphX(angle));
    graph.dot.setAttribute('cy', graphY(visible ? value : 0, graph.spec.range));
    graph.dot.style.display = visible ? '' : 'none';
  }
  angleValue.textContent = `${(angle * 180 / Math.PI).toFixed(1)}°`;
  cosValue.textContent = cosine.toFixed(3);
  sinValue.textContent = sine.toFixed(3);
  slider.value = String(angle * 180 / Math.PI);
  playButton.textContent = playing ? 'Ⅱ Pause' : '▶ Play';
  playButton.setAttribute('aria-pressed', String(playing));
}

slider.addEventListener('input', () => {
  playing = false;
  update(Number(slider.value) * Math.PI / 180);
});
playButton.addEventListener('click', () => {
  playing = !playing;
  if (playing && angle >= total - 0.001) update(0);
  else update(angle);
});

function resize() {
  const springWidth = springPanel.clientWidth;
  const springHeight = springPanel.clientHeight;
  springRenderer.setSize(springWidth, springHeight, false);
  const springAspect = springWidth / springHeight;
  const springViewHeight = Math.max(3.7, 5.4 / springAspect);
  const springViewWidth = springViewHeight * springAspect;
  springCamera.left = -springViewWidth / 2;
  springCamera.right = springViewWidth / 2;
  springCamera.top = springViewHeight / 2;
  springCamera.bottom = -springCamera.top;
  springCamera.updateProjectionMatrix();

  const circleWidth = circlePanel.clientWidth;
  const circleHeight = circlePanel.clientHeight;
  circleRenderer.setSize(circleWidth, circleHeight, false);
  const circleViewHeight = 3.7;
  const circleAspect = circleWidth / circleHeight;
  circleCamera.top = circleViewHeight / 2;
  circleCamera.bottom = -circleViewHeight / 2;
  circleCamera.left = -circleViewHeight * circleAspect / 2;
  circleCamera.right = circleViewHeight * circleAspect / 2;
  circleCamera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(springPanel);
new ResizeObserver(resize).observe(circlePanel);
resize();
update(0);

function render(time) {
  requestAnimationFrame(render);
  const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
  previousTime = time;
  if (playing) update(angle + delta * 0.5);
  springControls.update();
  springRenderer.render(springScene, springCamera);
  circleRenderer.render(circleScene, circleCamera);
}
requestAnimationFrame(render);
