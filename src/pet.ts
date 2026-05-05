type AnimationState = "idle" | "alert" | "sleep" | "prayer" | "happy";

interface PetStatus {
  animation: AnimationState;
  bubbleText?: string;
}

const FRAME_SIZE = 120;
const SOURCE_FRAME_SIZE = 512;
const SOURCE_FRAME_GUTTER = 4;
const FRAME_COLUMNS = 3;
const _FRAME_COUNT = 6;
const FRAME_MS = 675;
const animationStates: readonly AnimationState[] = [
  "idle",
  "alert",
  "sleep",
  "prayer",
  "happy",
];
const loopingStates = new Set<AnimationState>(["idle", "sleep", "prayer"]);
const frameSequences = {
  idle: [3, 4, 5],
  alert: [0, 1, 2, 3, 4, 5],
  sleep: [0, 2],
  prayer: [0, 1, 2, 3, 4, 5],
  happy: [0, 1, 2, 3, 4, 5],
} as const satisfies Record<AnimationState, readonly number[]>;
const frameCenters = {
  idle: [
    [275.5, 274],
    [247, 274],
    [230, 274.5],
    [275.5, 247.5],
    [246, 247.5],
    [229, 247.5],
  ],
  alert: [
    [291, 259.5],
    [262, 258.5],
    [248.5, 259.5],
    [292, 228.5],
    [252, 230],
    [258, 230.5],
  ],
  sleep: [
    [292, 234],
    [255.5, 233.5],
    [243, 234],
    [292, 191.5],
    [255.5, 191.5],
    [245, 192],
  ],
  prayer: [
    [267.5, 277.5],
    [243.5, 277],
    [237.5, 277.5],
    [278.5, 235],
    [249.5, 234.5],
    [242.5, 236],
  ],
  happy: [
    [292, 278.5],
    [246.5, 280],
    [256.5, 280],
    [292, 237.5],
    [255.5, 237.5],
    [249, 238.5],
  ],
} as const satisfies Record<
  AnimationState,
  readonly (readonly [number, number])[]
>;

const spriteElement = document.querySelector<HTMLCanvasElement>("#sprite");
const bubbleElement = document.querySelector<HTMLElement>("#bubble");
const devBadgeElement = document.querySelector<HTMLElement>("#dev-badge");

if (spriteElement === null) {
  throw new Error("Missing #sprite element");
}

if (bubbleElement === null) {
  throw new Error("Missing #bubble element");
}

if (devBadgeElement === null) {
  throw new Error("Missing #dev-badge element");
}

const sprite = spriteElement;
const bubble = bubbleElement;
const devBadge = devBadgeElement;
const spriteContext = sprite.getContext("2d");

if (spriteContext === null) {
  throw new Error("Missing 2D canvas context");
}

const context: CanvasRenderingContext2D = spriteContext;

context.imageSmoothingEnabled = true;
context.imageSmoothingQuality = "high";
devBadge.hidden = !window.hudhud.isDev;

const spriteImages = new Map<AnimationState, HTMLImageElement>();

let currentState: AnimationState = "idle";
let currentFrameIndex = 0;
let lastFrameAt = 0;
let animationRequestId: number | undefined;
let isDragging = false;
let didDrag = false;
let lastPointerScreenX = 0;
let lastPointerScreenY = 0;

function spriteUrlFor(state: AnimationState): string {
  return `../assets/sprites/${state}.png`;
}

function spriteImageFor(state: AnimationState): HTMLImageElement {
  const cachedImage = spriteImages.get(state);

  if (cachedImage !== undefined) {
    return cachedImage;
  }

  const image = new Image();
  image.src = spriteUrlFor(state);
  image.addEventListener("load", () => {
    if (state === currentState) {
      paintFrame();
    }
  });
  spriteImages.set(state, image);
  return image;
}

function preloadSprites(): void {
  for (const state of animationStates) {
    spriteImageFor(state);
  }
}

function paintFrame(): void {
  const image = spriteImageFor(currentState);

  if (!image.complete || image.naturalWidth === 0) {
    return;
  }

  const sequence = frameSequences[currentState];
  const currentFrame = sequence[currentFrameIndex] ?? sequence[0];
  const column = currentFrame % FRAME_COLUMNS;
  const row = Math.floor(currentFrame / FRAME_COLUMNS);
  const centers = frameCenters[currentState];
  const targetCenter = centers[0];
  const frameCenter = centers[currentFrame] ?? targetCenter;
  const scale = FRAME_SIZE / SOURCE_FRAME_SIZE;
  const offsetX = (targetCenter[0] - frameCenter[0]) * scale;
  const offsetY = (targetCenter[1] - frameCenter[1]) * scale;

  context.clearRect(0, 0, FRAME_SIZE, FRAME_SIZE);
  context.drawImage(
    image,
    column * SOURCE_FRAME_SIZE + SOURCE_FRAME_GUTTER,
    row * SOURCE_FRAME_SIZE + SOURCE_FRAME_GUTTER,
    SOURCE_FRAME_SIZE - SOURCE_FRAME_GUTTER * 2,
    SOURCE_FRAME_SIZE - SOURCE_FRAME_GUTTER * 2,
    offsetX,
    offsetY,
    FRAME_SIZE,
    FRAME_SIZE,
  );
}

function advanceFrame(): boolean {
  const sequence = frameSequences[currentState];
  currentFrameIndex += 1;

  if (currentFrameIndex >= sequence.length) {
    if (loopingStates.has(currentState)) {
      currentFrameIndex = 0;
    } else {
      setAnimation("idle");
      return false;
    }
  }

  paintFrame();
  return true;
}

function animationLoop(now: number): void {
  if (now - lastFrameAt >= FRAME_MS) {
    lastFrameAt = now;

    if (!advanceFrame()) {
      return;
    }
  }

  animationRequestId = window.requestAnimationFrame(animationLoop);
}

function setAnimation(state: AnimationState): void {
  if (currentState === state && animationRequestId !== undefined) {
    return;
  }

  currentState = state;
  currentFrameIndex = 0;
  paintFrame();

  if (animationRequestId !== undefined) {
    window.cancelAnimationFrame(animationRequestId);
  }

  lastFrameAt = performance.now();
  animationRequestId = window.requestAnimationFrame(animationLoop);
}

function renderBubble(text: string | undefined): void {
  const trimmedText = text?.trim() ?? "";
  bubble.hidden = trimmedText === "";
  bubble.textContent = trimmedText;
}

function updatePetStatus(status: PetStatus): void {
  setAnimation(status.animation);
  renderBubble(status.bubbleText);
}

window.hudhud.onUpdatePetStatus(updatePetStatus);

window.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  window.hudhud.showPetMenu();
});

window.addEventListener("mousedown", (event) => {
  if (event.button !== 0) {
    return;
  }

  isDragging = true;
  didDrag = false;
  lastPointerScreenX = event.screenX;
  lastPointerScreenY = event.screenY;
});

window.addEventListener("mousemove", (event) => {
  if (!isDragging) {
    return;
  }

  const deltaX = event.screenX - lastPointerScreenX;
  const deltaY = event.screenY - lastPointerScreenY;

  if (deltaX === 0 && deltaY === 0) {
    return;
  }

  didDrag = true;
  lastPointerScreenX = event.screenX;
  lastPointerScreenY = event.screenY;
  window.hudhud.movePetWindow(deltaX, deltaY);
});

window.addEventListener("mouseup", (event) => {
  if (event.button !== 0 || !isDragging) {
    return;
  }

  isDragging = false;

  if (didDrag) {
    return;
  }

  window.hudhud.showMainWindow();
});

window.addEventListener("mouseleave", () => {
  isDragging = false;
});

preloadSprites();
updatePetStatus({
  animation: "idle",
});
