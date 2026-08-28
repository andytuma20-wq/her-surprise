/* ==========================================================================
   FOR RUBY — script.js (v2: feminine scrapbook redesign)
   ==========================================================================
   Everything you're likely to want to customize lives in CONFIG below.
   ========================================================================== */

const CONFIG = {
  // ---- NAMES ----
  // Her name — automatically replaces every ".her-name" span in the HTML.
  herName: "Ruby",

  // Your name — shown on the final signature line.
  myName: "Uncle T🤠",

  // ---- MUSIC ----
  // Set to true once you've placed a file named "music.mp3" in this same
  // folder. It never autoplays with sound — she has to tap the music button
  // herself (browsers block autoplay with sound anyway).
  enableMusic: true,

  // ---- OPTIONAL MEMORIES ----
  // Short lines / inside jokes shown on the final scrapbook page.
  // Leave the array empty ( [] ) to hide this section entirely. Example:
  // memories: ["That time we got lost looking for the matatu stage 😂", "The 2am voice notes about nothing."]
  memories: [],

  // ---- OPTIONAL PHOTOS ----
  // Filenames of images placed in this same folder, e.g. ["photo1.jpg", "photo2.jpg"].
  // Leave empty to hide the gallery entirely.
  photos: [],

  // ---- DOLL / FLOWER ILLUSTRATIONS ----
  // The doll character and all flowers/sparkles/butterflies/bows are drawn
  // as simple original SVG shapes inside index.html, in the
  // <svg style="position:absolute"> block near the top of <body>, under
  // "REUSABLE SVG ART LIBRARY". To swap in your own illustration instead:
  //   1. Add your image file (e.g. "doll.png") to this folder.
  //   2. In index.html, find `<svg class="doll-svg"><use href="#art-doll"/></svg>`
  //      and replace it with `<img src="doll.png" class="doll-svg" alt="" />`
  //   3. Do the same for any <use href="#art-flower"/> etc. you want to replace.
  // The doll's colors (skin/hair/dress) can also just be edited via the
  // --doll-* CSS variables at the top of style.css, no illustration needed.

  // ---- NO-BUTTON PLAYFULNESS ----
  // How many times the "NOT RIGHT NOW" button playfully dodges before
  // letting her click it normally.
  noDodgeAttempts: 4,
};

// Messages shown while the NO button is "dodging". Feel free to edit.
const DODGE_MESSAGES = [
  "Are you sure? 👀",
  "Think about it, Ruby 😂",
  "Waittt…",
  "Okay okay, I'm listening 😭",
];

/* ==========================================================================
   INIT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  setupParticles();
  setupNavigation();
  setupQuestionButtons();
  setupMusic();
  setupRestart();
  revealScreen(document.getElementById("screen1")); // reveal opening lines
});

function applyConfig() {
  document.querySelectorAll(".her-name").forEach((el) => {
    el.textContent = CONFIG.herName;
  });
  const sig = document.getElementById("signatureName");
  if (sig) sig.textContent = CONFIG.myName;

  // memories
  if (CONFIG.memories && CONFIG.memories.length > 0) {
    const wrap = document.getElementById("memoriesWrap");
    const grid = document.getElementById("memoriesGrid");
    CONFIG.memories.forEach((m) => {
      const card = document.createElement("div");
      card.className = "memory-card";
      card.textContent = m;
      grid.appendChild(card);
    });
    wrap.hidden = false;
  }

  // photos
  if (CONFIG.photos && CONFIG.photos.length > 0) {
    const wrap = document.getElementById("galleryWrap");
    const strip = document.getElementById("photoStrip");
    CONFIG.photos.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      strip.appendChild(img);
    });
    wrap.hidden = false;
  }
}

/* ==========================================================================
   SCREEN NAVIGATION + TEXT REVEAL
   ========================================================================== */

// Order used purely to animate the top progress thread.
const PROGRESS_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10yes", "10no", "11"];

function setupNavigation() {
  document.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = "screen" + btn.getAttribute("data-next");
      goToScreen(document.getElementById(targetId));
    });
  });
}

function goToScreen(targetSection) {
  if (!targetSection) return;
  const current = document.querySelector(".screen.active");
  if (current) current.classList.remove("active");
  targetSection.classList.add("active");
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  updateThread(targetSection.dataset.screen);
  revealScreen(targetSection);

  if (targetSection.id === "screen10yes") {
    restartDollBounce();
  }
}

function updateThread(screenKey) {
  const idx = PROGRESS_ORDER.indexOf(screenKey);
  const pct = idx === -1 ? 0 : (idx / (PROGRESS_ORDER.length - 1)) * 100;
  const fill = document.getElementById("threadFill");
  if (fill) fill.style.width = pct + "%";
}

// Reveals each [data-reveal] element inside a screen one at a time.
function revealScreen(section) {
  const items = section.querySelectorAll("[data-reveal]");
  const baseGap = 400; // ms between each line appearing
  let delay = 250;
  items.forEach((el) => {
    el.classList.remove("is-visible");
    const extra = parseInt(el.dataset.revealDelay || "0", 10);
    delay += extra;
    setTimeout(() => el.classList.add("is-visible"), delay);
    delay += baseGap;
  });
}

// Replays the doll's little bounce-in animation each time she reaches the
// "you said yes" screen (CSS animations don't replay on their own).
function restartDollBounce() {
  const doll = document.getElementById("dollCelebrate");
  if (!doll) return;
  doll.classList.remove("doll-celebrate");
  void doll.offsetWidth; // force reflow so the animation can restart
  doll.classList.add("doll-celebrate");
}

/* ==========================================================================
   THE QUESTION SCREEN — YES / NO
   ========================================================================== */

function setupQuestionButtons() {
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const dodgeMsg = document.getElementById("dodgeMsg");

  let attempts = 0;

  function showDodgeMessage(text) {
    dodgeMsg.textContent = text;
    dodgeMsg.classList.add("show");
    clearTimeout(showDodgeMessage._t);
    showDodgeMessage._t = setTimeout(() => dodgeMsg.classList.remove("show"), 1800);
  }

  function dodge() {
    // Move the NO button to a random, safe position within the viewport.
    const margin = 70;
    const btnRect = noBtn.getBoundingClientRect();
    const maxX = window.innerWidth - btnRect.width - margin;
    const maxY = window.innerHeight - btnRect.height - margin;
    const newX = Math.max(margin, Math.random() * maxX);
    const newY = Math.max(margin, Math.random() * maxY);

    noBtn.style.position = "fixed";
    noBtn.style.left = newX + "px";
    noBtn.style.top = newY + "px";
    noBtn.style.margin = "0";
    noBtn.style.zIndex = "70";
  }

  function resetPosition() {
    noBtn.style.position = "";
    noBtn.style.left = "";
    noBtn.style.top = "";
    noBtn.style.margin = "";
    noBtn.style.zIndex = "";
  }

  // Desktop: dodge on hover approach too, for extra playfulness.
  noBtn.addEventListener("mouseenter", () => {
    if (attempts < CONFIG.noDodgeAttempts) dodge();
  });

  noBtn.addEventListener("click", (e) => {
    if (attempts < CONFIG.noDodgeAttempts) {
      e.preventDefault();
      showDodgeMessage(DODGE_MESSAGES[attempts % DODGE_MESSAGES.length]);
      dodge();
      attempts++;
      return;
    }
    // Dodging is over — this click counts for real.
    resetPosition();
    goToScreen(document.getElementById("screen10no"));
  });

  yesBtn.addEventListener("click", () => {
    goToScreen(document.getElementById("screen10yes"));
    triggerCelebration();
  });

  // Exposed so restart() can put the button back where it belongs.
  setupQuestionButtons._reset = () => {
    attempts = 0;
    resetPosition();
    dodgeMsg.classList.remove("show");
  };
}

/* ==========================================================================
   AMBIENT PARTICLES — drifting petals + tiny sparkles
   ========================================================================== */

function setupParticles() {
  const canvas = document.getElementById("particle-canvas");
  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let particles = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const petalColors = ["#d98a97", "#f6cdab", "#d9cdec", "#f7dbe0"];
  const count = window.innerWidth < 600 ? 16 : 26;

  for (let i = 0; i < count; i++) {
    const isPetal = Math.random() < 0.7;
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: isPetal ? Math.random() * 6 + 5 : Math.random() * 2 + 1,
      speed: Math.random() * 0.4 + 0.15,
      drift: (Math.random() - 0.5) * 0.4,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.015 + 0.005,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 0.6,
      color: petalColors[Math.floor(Math.random() * petalColors.length)],
      isPetal,
      alpha: Math.random() * 0.35 + 0.25,
    });
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSparkle(p) {
    ctx.save();
    ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.sway));
    ctx.fillStyle = "#93384a";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.sway += p.swaySpeed;
      if (p.isPetal) drawPetal(p); else drawSparkle(p);

      if (!reducedMotion) {
        p.y += p.speed;
        p.x += p.drift + Math.sin(p.sway) * 0.3;
        p.rotation += p.rotSpeed;
        if (p.y > h + 15) {
          p.y = -15;
          p.x = Math.random() * w;
        }
        if (p.x < -15) p.x = w + 15;
        if (p.x > w + 15) p.x = -15;
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ==========================================================================
   YES CELEBRATION — pink confetti, hearts, flowers, butterflies, sparkles
   ========================================================================== */

function triggerCelebration() {
  const canvas = document.getElementById("celebration-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = "block";

  document.body.classList.add("shake");
  setTimeout(() => document.body.classList.remove("shake"), 500);

  const colors = ["#d98a97", "#93384a", "#f6cdab", "#d9cdec", "#fffaf6"];
  const shapes = ["heart", "flower", "confetti", "sparkle"];
  const pieces = [];
  const pieceCount = window.innerWidth < 600 ? 80 : 140;

  for (let i = 0; i < pieceCount; i++) {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      size: shape === "confetti" ? Math.random() * 7 + 4 : Math.random() * 10 + 9,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 2 + 1.4,
      speedX: (Math.random() - 0.5) * 1.6,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
      shape,
    });
  }

  function drawHeart(x, y, size, color, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.beginPath();
    const s = size / 2;
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s, -s * 0.6, -s * 1.6, s * 0.6, 0, s * 1.6);
    ctx.bezierCurveTo(s * 1.6, s * 0.6, s, -s * 0.6, 0, s * 0.3);
    ctx.fill();
    ctx.restore();
  }

  function drawFlower(x, y, size, color, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillStyle = color;
    const r = size / 3.2;
    for (let a = 0; a < 4; a++) {
      ctx.beginPath();
      ctx.ellipse(0, -r, r * 0.7, r, (a * Math.PI) / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(Math.PI / 2);
    }
    ctx.fillStyle = "#f6cdab";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSparkleShape(x, y, size, color, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size * 0.15, -size * 0.15);
    ctx.lineTo(size / 2, 0);
    ctx.lineTo(size * 0.15, size * 0.15);
    ctx.lineTo(0, size / 2);
    ctx.lineTo(-size * 0.15, size * 0.15);
    ctx.lineTo(-size / 2, 0);
    ctx.lineTo(-size * 0.15, -size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const duration = 4400;
  const start = performance.now();

  function animate(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;

      const fadeStart = duration - 900;
      let alpha = 1;
      if (elapsed > fadeStart) alpha = Math.max(0, 1 - (elapsed - fadeStart) / 900);
      ctx.globalAlpha = alpha;

      if (p.shape === "heart") drawHeart(p.x, p.y, p.size, p.color, p.rotation);
      else if (p.shape === "flower") drawFlower(p.x, p.y, p.size, p.color, p.rotation);
      else if (p.shape === "sparkle") drawSparkleShape(p.x, p.y, p.size, p.color, p.rotation);
      else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
    });
    ctx.globalAlpha = 1;

    if (elapsed < duration) {
      requestAnimationFrame(animate);
    } else {
      canvas.style.display = "none";
    }
  }
  requestAnimationFrame(animate);
}

/* ==========================================================================
   OPTIONAL BACKGROUND MUSIC
   ========================================================================== */

function setupMusic() {
  if (!CONFIG.enableMusic) return;

  const btn = document.getElementById("musicBtn");
  const audio = document.getElementById("bgAudio");
  btn.hidden = false;

  let playing = false;
  btn.addEventListener("click", () => {
    if (!playing) {
      audio.volume = 0.5;
      audio.play().catch(() => {
        // File missing or blocked — fail silently, no broken UI.
      });
      playing = true;
      btn.classList.add("playing");
      document.getElementById("musicIcon").textContent = "♫";
    } else {
      audio.pause();
      playing = false;
      btn.classList.remove("playing");
      document.getElementById("musicIcon").textContent = "♪";
    }
  });
}

/* ==========================================================================
   RESTART
   ========================================================================== */

function setupRestart() {
  const btn = document.getElementById("restartBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (typeof setupQuestionButtons._reset === "function") {
      setupQuestionButtons._reset();
    }
    goToScreen(document.getElementById("screen1"));
  });
}
