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
  let gameOver = false;

  const player = {
    x: 40,
    y: 40,
    size: 28,
    speed: 180,
    vx: 0,
    vy: 0,
  };

  // a single monster that chases the player
  const monster = {
    x: size.w - 80,
    y: size.h - 80,
    size: 36,
    baseSpeed: 90, // base speed in px/s
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
    monster.x = size.w - 80; monster.y = size.h - 80;
    collectibles = [];
    score = 0; scoreEl.textContent = `Score: ${score}`;
    spawnTimer = 0;
    gameOver = false;
    running = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function startGame(){
    if(gameOver){
      resetGame();
    }
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

  function checkAABB(a, b){
    return a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y;
  }

  function update(dt){
    if(gameOver) return;
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

    // check collectibles collisions
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

    // monster chases player
    const mx = monster.x + monster.size/2;
    const my = monster.y + monster.size/2;
    const px = player.x + player.size/2;
    const py = player.y + player.size/2;
    let dx = px - mx, dy = py - my;
    const dist = Math.hypot(dx, dy) || 1;
    dx /= dist; dy /= dist;
    const mspd = monster.baseSpeed * (0.9 + diff * 0.6); // scale with difficulty
    monster.x += dx * mspd * dt;
    monster.y += dy * mspd * dt;

    // clamp monster
    monster.x = Math.max(0, Math.min(size.w - monster.size, monster.x));
    monster.y = Math.max(0, Math.min(size.h - monster.size, monster.y));

    // check collision with player
    if(checkAABB(player, monster)){
      gameOver = true;
      running = false;
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      cancelAnimationFrame(animationId);
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

    // draw monster
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(monster.x, monster.y, monster.size, monster.size);
    // monster eyes
    ctx.fillStyle = '#111';
    ctx.fillRect(monster.x + 8, monster.y + 8, 6, 6);
    ctx.fillRect(monster.x + monster.size - 14, monster.y + 8, 6, 6);

    // HUD
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(6,6,130,26);
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 12, 24);

    if(gameOver){
      ctx.fillStyle = 'rgba(2,6,12,0.6)';
      ctx.fillRect(0,0,size.w,size.h);
      ctx.fillStyle = '#fff'; ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', size.w/2, size.h/2 - 10);
      ctx.font = '18px sans-serif';
      ctx.fillText(`Final Score: ${score}`, size.w/2, size.h/2 + 20);
      ctx.textAlign = 'start';
    }
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
