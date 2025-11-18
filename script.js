(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const difficultySelect = document.getElementById('difficulty');
  const scoreEl = document.getElementById('score');

  const size = {w: canvas.width, h: canvas.height};

  let lastTime = 0;
  let animationId = null;
  let running = false;
  let spawnTimer = 0;
  let spawnInterval = 2000; // ms

  const player = {
    x: 40,
    y: 40,
    size: 28,
    speed: 180,
    vx: 0,
    vy: 0,
  };

  let collectibles = [];
  let score = 0;

  const keys = new Set();

  function rand(min, max){ return Math.random() * (max - min) + min }

  function spawnCollectible(){
    const r = 10;
    const x = rand(r, size.w - r);
    const y = rand(r, size.h - r);
    collectibles.push({x, y, r, created: Date.now()});
  }

  function resetGame(){
    player.x = 40; player.y = 40; player.vx = 0; player.vy = 0;
    collectibles = [];
    score = 0; scoreEl.textContent = `Score: ${score}`;
    spawnTimer = 0;
  }

  function startGame(){
    if(running) return;
    running = true;
    startBtn.disabled = true; pauseBtn.disabled = false;
    lastTime = performance.now();
    animationId = requestAnimationFrame(loop);
  }

  function pauseGame(){
    if(!running) return;
    running = false;
    startBtn.disabled = false; pauseBtn.disabled = true;
    cancelAnimationFrame(animationId);
  }

  function update(dt){
    const diff = parseFloat(difficultySelect.value) || 1;
    const spd = player.speed * diff;

    // input -> velocity
    player.vx = 0; player.vy = 0;
    if(keys.has('ArrowLeft') || keys.has('a')) player.vx = -1;
    if(keys.has('ArrowRight') || keys.has('d')) player.vx = 1;
    if(keys.has('ArrowUp') || keys.has('w')) player.vy = -1;
    if(keys.has('ArrowDown') || keys.has('s')) player.vy = 1;

    // normalize diagonal
    if(player.vx !== 0 && player.vy !== 0){
      player.vx *= Math.SQRT1_2; player.vy *= Math.SQRT1_2;
    }

    player.x += player.vx * spd * dt;
    player.y += player.vy * spd * dt;

    // clamp to canvas
    player.x = Math.max(0, Math.min(size.w - player.size, player.x));
    player.y = Math.max(0, Math.min(size.h - player.size, player.y));

    // spawn logic
    spawnTimer += dt * 1000;
    const interval = spawnInterval / diff; // higher diff -> faster spawn
    if(spawnTimer >= interval){ spawnTimer = 0; spawnCollectible(); }

    // check collisions
    for(let i = collectibles.length - 1; i >= 0; i--){
      const c = collectibles[i];
      // simple rect-circle collision
      const cx = Math.max(player.x, Math.min(c.x, player.x + player.size));
      const cy = Math.max(player.y, Math.min(c.y, player.y + player.size));
      const dx = c.x - cx, dy = c.y - cy;
      if(dx*dx + dy*dy <= c.r*c.r){
        collectibles.splice(i,1);
        score += 1;
        scoreEl.textContent = `Score: ${score}`;
      }
    }
  }

  function draw(){
    ctx.clearRect(0,0,size.w,size.h);

    // draw player
    ctx.fillStyle = '#58a6ff';
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // draw collectibles
    for(const c of collectibles){
      ctx.beginPath(); ctx.fillStyle = '#ffd166'; ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.stroke();
    }

    // HUD
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(6,6,130,26);
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 12, 24);
  }

  function loop(ts){
    const dt = (ts - lastTime) / 1000; lastTime = ts;
    update(dt);
    draw();
    animationId = requestAnimationFrame(loop);
  }

  // events
  window.addEventListener('keydown', (e)=>{ keys.add(e.key); });
  window.addEventListener('keyup', (e)=>{ keys.delete(e.key); });

  startBtn.addEventListener('click', () => startGame());
  pauseBtn.addEventListener('click', () => pauseGame());
  resetBtn.addEventListener('click', () => { resetGame(); draw(); });

  difficultySelect.addEventListener('change', ()=>{
    // no-op: update occurs each frame; we can adjust spawnTimer to make changes immediate
  });

  // initialize
  resetGame(); draw();

  // expose for dev console
  window._tinyGame = { start: startGame, pause: pauseGame, reset: resetGame };

})();
