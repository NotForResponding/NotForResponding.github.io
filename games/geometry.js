(() => {
  const canvas = document.getElementById('geo');
  const ctx = canvas.getContext('2d');
  const retry = document.getElementById('retry');
  const W = canvas.width, H = canvas.height;

  const player = { x: 80, y: H-60, w: 36, h:36, vy:0, jump: -420 };
  const GRAV = 1500;
  let obstacles = [];
  let speed = 320; // world speed
  let spawnTimer = 0; let spawnInterval = 1.2; // s
  let last = performance.now(); let running = true; let score = 0;

  function spawn(){
    const h = 28 + Math.random()*60;
    obstacles.push({ x: W + 40, y: H - h - 20, w: 26 + Math.random()*36, h: h });
  }

  function reset(){
    player.y = H-60; player.vy = 0; obstacles = []; spawnTimer = 0; speed = 320; score = 0; running = true; last = performance.now();
  }

  function update(dt){
    if(!running) return;
    // physics
    player.vy += GRAV * dt; player.y += player.vy * dt;
    if(player.y > H - player.h - 20){ player.y = H - player.h - 20; player.vy = 0; }

    // obstacles
    spawnTimer += dt; if(spawnTimer > spawnInterval){ spawnTimer = 0; spawn(); }
    for(let i = obstacles.length-1;i>=0;i--){
      obstacles[i].x -= speed * dt;
      if(obstacles[i].x + obstacles[i].w < -50) obstacles.splice(i,1);
    }

    // collisions
    for(const ob of obstacles){
      if(ob.x < player.x + player.w && ob.x + ob.w > player.x && ob.y < player.y + player.h && ob.y + ob.h > player.y){
        running = false;
      }
    }

    score += dt * 100;
    // gradually increase speed
    speed += dt * 6;
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // background
    ctx.fillStyle = '#071226'; ctx.fillRect(0,0,W,H);

    // ground
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0,H-20,W,20);

    // player
    ctx.fillStyle = '#58a6ff'; ctx.fillRect(player.x, player.y, player.w, player.h);

    // obstacles
    ctx.fillStyle = '#ff6b6b';
    for(const ob of obstacles){ ctx.fillRect(ob.x, ob.y, ob.w, ob.h); }

    // HUD
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText(`Score: ${Math.floor(score)}`, 12, 22);

    if(!running){ ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.font='32px sans-serif'; ctx.fillText('Game Over', W/2, H/2); ctx.textAlign='start'; }
  }

  function loop(ts){ const dt = (ts - last)/1000; last = ts; update(dt); draw(); requestAnimationFrame(loop); }

  window.addEventListener('keydown', (e)=>{ if(e.code==='Space'){ if(player.y >= H-player.h-20-0.5){ player.vy = player.jump; } if(!running){ reset(); } } });
  retry.addEventListener('click', reset);

  reset(); requestAnimationFrame(loop);

})();
