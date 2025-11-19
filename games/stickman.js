(() => {
  const canvas = document.getElementById('stick');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('start');
  const pauseBtn = document.getElementById('pause');
  const resetBtn = document.getElementById('restart');
  const W = canvas.width, H = canvas.height;

  // player as small circle
  const player = { x: 120, y: 320, vx: 0, vy: 0, r: 12 };
  const GRAV = 900; // px/s^2
  let anchor = null; // {x,y,length}
  let ropeLen = 0;
  let time = 0; let running = true; let score = 0;

  function reset(){
    player.x = 120; player.y = 320; player.vx = 0; player.vy = 0; anchor = null; time = 0; score = 0; running = false; draw();
    startBtn.disabled = false; pauseBtn.disabled = true;
  }

  function start(){
    if(running) return;
    running = true; startBtn.disabled = true; pauseBtn.disabled = false; last = performance.now(); requestAnimationFrame(loop);
  }

  function pause(){
    running = false; startBtn.disabled = false; pauseBtn.disabled = true;
  }

  function attach(x,y){
    anchor = {x, y};
    ropeLen = Math.hypot(player.x - x, player.y - y);
    // give some tangential velocity when attaching
    player.vx += (Math.random()-0.5) * 80;
    player.vy -= 60;
  }

  function detach(){ anchor = null; }

  function update(dt){
    if(!running) return;
    time += dt;
    // basic integration
    if(anchor){
      // compute vector from anchor to player
      let dx = player.x - anchor.x, dy = player.y - anchor.y;
      let dist = Math.hypot(dx, dy) || 0.0001;
      // radial direction
      let nx = dx/dist, ny = dy/dist;
      // velocity components
      let vr = player.vx * nx + player.vy * ny;
      let vt_x = player.vx - vr*nx, vt_y = player.vy - vr*ny;

      // gravity
      player.vx += 0 * dt; player.vy += GRAV * dt;

      // enforce rope constraint: keep distance close to ropeLen by projecting
      player.x = anchor.x + nx * ropeLen;
      player.y = anchor.y + ny * ropeLen;

      // simple swing: rotate tangential velocity around anchor
      // approximate by adding perpendicular acceleration from gravity
      // compute perpendicular to (nx,ny)
      let px = -ny, py = nx;
      // add small tangential acceleration from gravity
      let tangential = (GRAV * (px*0 + py*0)) * dt;
      // retain tangential velocity
      player.vx = vt_x; player.vy = vt_y;
      // apply small damping
      player.vx *= 0.995; player.vy *= 0.995;
      // let slight change from gravity
      player.vy += 0;
    } else {
      // freefall
      player.vy += GRAV * dt;
      player.x += player.vx * dt;
      player.y += player.vy * dt;
    }

    // ground collision / wrap
    if(player.y > H - player.r){ player.y = H - player.r; player.vy *= -0.35; }
    if(player.x < player.r) { player.x = player.r; player.vx *= -0.3; }
    if(player.x > W - player.r) { player.x = W - player.r; player.vx *= -0.3; }

    // simple scoring by time alive
    score = Math.floor(time*10);
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // background
    ctx.fillStyle = '#071226'; ctx.fillRect(0,0,W,H);

    // draw anchor and rope
    if(anchor){
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(anchor.x, anchor.y); ctx.lineTo(player.x, player.y); ctx.stroke();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(anchor.x, anchor.y, 6,0,Math.PI*2); ctx.fill();
    }

    // draw player
    ctx.fillStyle = '#58a6ff'; ctx.beginPath(); ctx.arc(player.x, player.y, player.r,0,Math.PI*2); ctx.fill();

    // HUD
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText(`Time: ${score/10}s`, 12, 22);
  }

  let last = performance.now();
  function loop(ts){
    const dt = (ts - last)/1000; last = ts; update(dt); draw(); requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    attach(e.clientX - rect.left, e.clientY - rect.top);
  });
  canvas.addEventListener('mouseup', detach);
  window.addEventListener('keydown', (e)=>{ if(e.code==='Space'){ player.vy -= 220; player.vx += 60; } });
  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', pause);
  resetBtn.addEventListener('click', reset);

  reset();

})();
