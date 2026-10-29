
const stacks = {
  frontend: [
    "Vue", "React", "Angular", "Svelte", "Astro", "Next.js", "Nuxt", "Classic HTML"
  ],
  css: [
    "Tailwind", "Bootstrap", "Bulma", "Classic CSS"
  ],
  language: [
    "JavaScript", "TypeScript", "CoffeeScript",
    "PHP", "Python"
  ],
  database: [
    "MongoDB", "SQLite", "PostgreSQL", "MySQL"
  ],
  backend: [
    "Flask", "Express", "FastAPI", "Django",
    "Laravel", "NestJS", "Spring Boot",
    "Phoenix", "ASP.NET"
  ]
};

const labels = {
  frontend: "FRONTEND",
  css: "CSS FRAMEWORK",
  language: "LANGUAGE",
  database: "DATABASE",
  backend: "BACKEND"
};

const reelsContainer = document.getElementById("reels");
const spinButton = document.getElementById("spinButton");
const enableDb = document.getElementById("enableDb");
const enableBackend = document.getElementById("enableBackend");
const spinCount = document.getElementById("spinCount");
const status = document.getElementById("status");
const result = document.getElementById("result");
const resultItems = document.getElementById("resultItems");
const copyButton = document.getElementById("copyButton");

let spinning = false;
let spins = 0;
let currentResult = {};

function activeReels() {
  const keys = ["frontend", "css", "language"];

  if (enableDb.checked) keys.push("database");
  if (enableBackend.checked) keys.push("backend");

  return keys;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function itemHeight() {
  return window.matchMedia("(max-width: 600px)").matches
    ? 55
    : 70;
}

function createReel(key, selected) {
  const reel = document.createElement("div");
  reel.className = "reel";
  reel.dataset.key = key;

  const label = document.createElement("div");
  label.className = "reel-label";
  label.textContent = labels[key];

  const windowElement = document.createElement("div");
  windowElement.className = "reel-window";

  const track = document.createElement("div");
  track.className = "reel-track";

  const items = stacks[key];
  const index = items.indexOf(selected);

  const values = [
    items[(index - 1 + items.length) % items.length],
    selected,
    items[(index + 1) % items.length]
  ];

  values.forEach((value, i) => {
    const element = document.createElement("div");
    element.className = "reel-item";

    if (i === 1) element.classList.add("selected");

    element.textContent = value;
    track.appendChild(element);
  });

  const payline = document.createElement("div");
  payline.className = "payline";

  windowElement.append(track, payline);
  reel.append(label, windowElement);

  return reel;
}

function renderReels() {
  reelsContainer.replaceChildren();

  activeReels().forEach(key => {
    const selected =
      currentResult[key] ?? randomItem(stacks[key]);

    currentResult[key] = selected;
    reelsContainer.appendChild(createReel(key, selected));
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function animateReel(reel, finalValue, delay) {
  const key = reel.dataset.key;
  const track = reel.querySelector(".reel-track");
  const items = stacks[key];

  const sequence = [];

  for (let i = 0; i < 36; i++) {
    sequence.push(randomItem(items));
  }

  sequence.push(finalValue);
  sequence.push(randomItem(items));

  track.replaceChildren();

  sequence.forEach(value => {
    const element = document.createElement("div");
    element.className = "reel-item";
    element.textContent = value;
    track.appendChild(element);
  });

  const height = itemHeight();

  track.style.transition = "none";
  track.style.transform = `translateY(${height}px)`;

  track.getBoundingClientRect();

  reel.classList.add("spinning");

  const duration = 1200 + delay;
  const targetY = -(36 - 1) * height;

  track.style.transition =
    `transform ${duration}ms cubic-bezier(.12,.72,.22,1)`;
  track.style.transform = `translateY(${targetY}px)`;

  await wait(duration + 100);

  const finished = createReel(key, finalValue);
  reel.replaceWith(finished);
}

async function spin() {
  if (spinning) return;

  spinning = true;
  spinButton.disabled = true;
  spinButton.textContent = "SPINNING...";
  status.textContent = "ROLLING...";
  result.hidden = true;

  const keys = activeReels();

  const newResult = {};
  keys.forEach(key => {
    newResult[key] = randomItem(stacks[key]);
  });

  const reelElements =
    [...reelsContainer.querySelectorAll(".reel")];

  await Promise.all(
    reelElements.map((reel, index) =>
      animateReel(reel, newResult[reel.dataset.key], index * 450)
    )
  );

  currentResult = { ...currentResult, ...newResult };

  spins++;
  spinCount.textContent = spins;

  spinning = false;
  spinButton.disabled = false;
  spinButton.innerHTML = '<span class="play">▶</span> SPIN AGAIN';
  status.textContent = "JACKPOT!";

  showResult(newResult);
}

function showResult(values) {
  resultItems.replaceChildren();

  for (const [key, value] of Object.entries(values)) {
    const chip = document.createElement("div");
    chip.className = "result-chip";

    const category = document.createElement("small");
    category.textContent = labels[key];

    const name = document.createElement("span");
    name.textContent = value;

    chip.append(category, name);
    resultItems.appendChild(chip);
  }

  result.hidden = false;
}

async function copyResult() {
  const text = Object.entries(currentResult)
    .filter(([key]) => activeReels().includes(key))
    .map(([key, value]) => `${labels[key]}: ${value}`)
    .join("\n");

  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = "Copied!";
    setTimeout(() => {
      copyButton.textContent = "Copy Stack";
    }, 1500);
  } catch (error) {
    console.error("Clipboard failed:", error);
    copyButton.textContent = "Copy failed";
  }
}

enableDb.addEventListener("change", () => {
  if (!spinning) {
    result.hidden = true;
    renderReels();
  }
});

enableBackend.addEventListener("change", () => {
  if (!spinning) {
    result.hidden = true;
    renderReels();
  }
});

spinButton.addEventListener("click", spin);
copyButton.addEventListener("click", copyResult);

renderReels();
