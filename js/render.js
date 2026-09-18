function drawTile(type,ore,sx,sy){
  const t=TILE;
  if(type===BLOCK.CORE){
    const g=ctx.createLinearGradient(sx,sy,sx+t,sy+t);
    g.addColorStop(0,'#1a1a2e');g.addColorStop(1,'#2a2a4a');
    ctx.fillStyle=g;ctx.fillRect(sx,sy,t+.5,t+.5);
    ctx.fillStyle='#3a3a5c';ctx.fillRect(sx+3,sy+3,t-6,t-6);
    ctx.strokeStyle='rgba(100,160,255,.35)';ctx.lineWidth=1.5;ctx.strokeRect(sx+4,sy+4,t-8,t-8);
  }else if(type===BLOCK.HOT){
    const pulse=0.5+0.5*Math.sin(animTime*3+(sx+sy)*0.01);
    const g=ctx.createRadialGradient(sx+t/2,sy+t/2,2,sx+t/2,sy+t/2,t*0.7);
    g.addColorStop(0,`rgba(255,${120+pulse*80|0},20,0.95)`);g.addColorStop(1,'#8a2010');
    ctx.fillStyle=g;ctx.fillRect(sx,sy,t+.5,t+.5);
  }else if(type===BLOCK.WATER){
    const w=0.5+0.5*Math.sin(animTime*1.5+sx*0.04+sy*0.03);
    ctx.fillStyle=`rgb(${20+w*15|0},${80+w*40|0},${160+w*40|0})`;
    ctx.fillRect(sx,sy,t+.5,t+.5);
  }else if(type===BLOCK.FERTILE){
    ctx.fillStyle='#4a6b3a';ctx.fillRect(sx,sy,t+.5,t+.5);
    ctx.fillStyle='rgba(90,140,50,.35)';ctx.fillRect(sx+2,sy+2,t-4,t-4);
  }else if(type===BLOCK.WALL){
    ctx.fillStyle='#3a3a3a';ctx.fillRect(sx,sy,t+.5,t+.5);
    ctx.fillStyle='#505050';ctx.fillRect(sx+2,sy+2,t-4,t-4);
  }else{
    ctx.fillStyle=COLORS[type]||'#5c4030';ctx.fillRect(sx,sy,t+.5,t+.5);
  }
  if(ore!==ORE.NONE){
    const oc=ORE_COLORS[ore];ctx.fillStyle=oc;ctx.globalAlpha=.9;
    const m=t*0.18;ctx.beginPath();
    ctx.moveTo(sx+t/2,sy+m);ctx.lineTo(sx+t-m,sy+t/2);ctx.lineTo(sx+t/2,sy+t-m);ctx.lineTo(sx+m,sy+t/2);
    ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  }
}
function draw(){
  ctx.clearRect(0,0,VIEW_W,VIEW_H);
  ctx.fillStyle='#0a0a0c';ctx.fillRect(0,0,VIEW_W,VIEW_H);
  const camCX=camera.x+VIEW_W/2, camCY=camera.y+VIEW_H/2;
  ctx.save();
  ctx.translate(VIEW_W/2,VIEW_H/2);
  ctx.scale(camera.zoom,camera.zoom);
  ctx.translate(-camCX,-camCY);
  const halfW=VIEW_W/(2*camera.zoom), halfH=VIEW_H/(2*camera.zoom);
  const sTX=Math.max(0,Math.floor((camCX-halfW)/TILE)-1);
  const sTY=Math.max(0,Math.floor((camCY-halfH)/TILE)-1);
  const eTX=Math.min(MAP_SIZE,Math.ceil((camCX+halfW)/TILE)+1);
  const eTY=Math.min(MAP_SIZE,Math.ceil((camCY+halfH)/TILE)+1);
  for(let y=sTY;y<eTY;y++)for(let x=sTX;x<eTX;x++)drawTile(map[y][x],oreMap[y][x],x*TILE,y*TILE);
  for(let y=sTY;y<eTY;y++)for(let x=sTX;x<eTX;x++){
    const b=buildMap[y][x];
    if(!b||b.type==='part')continue;
    const def=BUILDING_DEFS[b.type];if(!def)continue;
    const sx=x*TILE,sy=y*TILE,bw=TILE*def.size,bh=TILE*def.size;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(sx+3,sy+4,bw-2,bh-2);
    drawBlockModel(b.type,sx+bw/2,sy+bh/2,Math.min(bw,bh)-4,def.directional?(b.dir??0):null);
    if(typeof isConveyorType==='function'&&isConveyorType(b.type)){
      const d=b.dir??0;ctx.save();ctx.beginPath();ctx.rect(sx+3,sy+3,bw-6,bh-6);ctx.clip();
      const spd=(def.speed||0.08)*80;const off=(animTime*spd*TILE)%(TILE*0.35);
      ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=2.5;
      if(d===0||d===2){for(let i=-1;i<5;i++){const px=sx+(d===0?off:-off)+i*(TILE*0.35);ctx.beginPath();ctx.moveTo(px,sy+6);ctx.lineTo(px+7,sy+bh/2);ctx.lineTo(px,sy+bh-6);ctx.stroke()}}
      else{for(let i=-1;i<5;i++){const py=sy+(d===1?off:-off)+i*(TILE*0.35);ctx.beginPath();ctx.moveTo(sx+6,py);ctx.lineTo(sx+bw/2,py+7);ctx.lineTo(sx+bw-6,py);ctx.stroke()}}
      ctx.restore();drawDirArrow(sx+bw/2,sy+bh/2,d);
    }else if(def.directional)drawDirArrow(sx+bw/2,sy+bh/2,b.dir??0);
    if(def.mine){
      const cx=sx+bw/2,cy=sy+bh/2,ang=animTime*6;
      ctx.strokeStyle='rgba(255,200,80,.8)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(cx,cy,Math.min(bw,bh)*0.22,ang,ang+Math.PI*1.4);ctx.stroke();
    }
    if(def.category==='turret'){
      const cx=sx+bw/2,cy=sy+bh/2;
      ctx.strokeStyle='rgba(255,80,80,.2)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(cx,cy,Math.min((def.range||10)*TILE*0.1,bw*1.2),0,Math.PI*2);ctx.stroke();
    }
    if(def.size>1){
      ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(sx+3,sy+3,22,11);
      ctx.fillStyle='#ffe8a0';ctx.font='bold 9px system-ui';ctx.textAlign='left';
      ctx.fillText(def.size+'×'+def.size,sx+5,sy+11);
    }
    const ic=Object.values(b.items||{}).reduce((a,v)=>a+v,0);
    if(ic>=0.5){ctx.fillStyle='#fff';ctx.font='bold 12px system-ui';ctx.fillText(String(Math.floor(ic)),sx+5,sy+bh-6)}
    if(b.health!=null&&b.maxHealth&&b.health<b.maxHealth){
      const ratio=b.health/b.maxHealth;
      ctx.fillStyle='#333';ctx.fillRect(sx+2,sy+bh-5,bw-4,3);
      ctx.fillStyle=ratio>0.5?'#0f0':ratio>0.25?'#ff0':'#f00';
      ctx.fillRect(sx+2,sy+bh-5,(bw-4)*ratio,3);
    }
    const key=x+','+y;
    if(deleteSel.has(key)){ctx.strokeStyle='#ff2222';ctx.lineWidth=3;ctx.strokeRect(sx+.5,sy+.5,bw-1,bh-1)}
  }
  for(const s of shields){
    const alpha=0.12+0.1*(s.hp/s.maxHp);
    ctx.strokeStyle=`rgba(100,180,255,${0.35+0.4*s.hp/s.maxHp})`;
    ctx.fillStyle=`rgba(80,160,255,${alpha})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(s.x*TILE,s.y*TILE,s.range*TILE,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#6af';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(s.x*TILE,s.y*TILE,s.range*TILE+4,-Math.PI/2,-Math.PI/2+Math.PI*2*(s.hp/s.maxHp));ctx.stroke();
  }
  for(const gh of ghosts){
    const def=BUILDING_DEFS[gh.type];if(!def)continue;
    const sx=gh.x*TILE,sy=gh.y*TILE,bw=TILE*def.size,bh=TILE*def.size;
    const pulse=0.3+0.15*Math.sin(animTime*5);
    ctx.globalAlpha=pulse;drawBlockModel(gh.type,sx+bw/2,sy+bh/2,Math.min(bw,bh)-4,gh.dir??0);ctx.globalAlpha=1;
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(sx+1,sy+1,bw-2,bh-2);ctx.setLineDash([]);
  }
  for(const it of items){
    const res=RESOURCES.find(r=>r.id===it.type);if(!res)continue;
    const ix=it.x*TILE,iy=it.y*TILE;
    if(it.mass){ctx.strokeStyle='#ff0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ix,iy);ctx.lineTo(it.tx*TILE,it.ty*TILE);ctx.stroke()}
    ctx.fillStyle=res.color;ctx.beginPath();ctx.arc(ix,iy,it.mass?9:7,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.5;ctx.stroke();
  }
  for(const p of projectiles){
    ctx.strokeStyle=p.color||'#fff';ctx.lineWidth=2;ctx.globalAlpha=Math.max(0,p.life*3);
    ctx.beginPath();ctx.moveTo(p.x*TILE,p.y*TILE);ctx.lineTo(p.tx*TILE,p.ty*TILE);ctx.stroke();
    ctx.fillStyle=p.color||'#fff';ctx.beginPath();ctx.arc(p.x*TILE,p.y*TILE,3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
  for(const e of enemies){
    const ud=UNIT_DEFS[e.type]||UNIT_DEFS.enemy;
    ctx.fillStyle=ud.color;ctx.beginPath();ctx.arc(e.x*TILE,e.y*TILE,ud.size,0,Math.PI*2);ctx.fill();
    const bw=16,ratio=e.hp/e.maxHp;
    ctx.fillStyle='#333';ctx.fillRect(e.x*TILE-bw/2,e.y*TILE-ud.size-6,bw,3);
    ctx.fillStyle=ratio>0.5?'#0f0':ratio>0.25?'#ff0':'#f00';ctx.fillRect(e.x*TILE-bw/2,e.y*TILE-ud.size-6,bw*ratio,3);
  }
  for(const u of units){
    const ud=UNIT_DEFS[u.type]||UNIT_DEFS.dagger;
    ctx.save();ctx.translate(u.x*TILE,u.y*TILE);ctx.rotate(u.angle||0);
    ctx.fillStyle=ud.color;ctx.beginPath();ctx.moveTo(ud.size,0);ctx.lineTo(-ud.size*.6,-ud.size*.5);ctx.lineTo(-ud.size*.6,ud.size*.5);ctx.closePath();ctx.fill();
    ctx.restore();
    const bw=14,ratio=u.hp/u.maxHp;
    ctx.fillStyle='#333';ctx.fillRect(u.x*TILE-bw/2,u.y*TILE-ud.size-5,bw,3);
    ctx.fillStyle='#0f0';ctx.fillRect(u.x*TILE-bw/2,u.y*TILE-ud.size-5,bw*ratio,3);
  }
  const ssx=ship.x*TILE,ssy=ship.y*TILE;
  ctx.save();ctx.translate(ssx,ssy);ctx.rotate(ship.angle);
  ctx.fillStyle='#7a7a82';ctx.beginPath();ctx.moveTo(ship.size,0);ctx.lineTo(-ship.size*.65,-ship.size*.55);ctx.lineTo(-ship.size*.35,0);ctx.lineTo(-ship.size*.65,ship.size*.55);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ff8c00';ctx.beginPath();ctx.moveTo(ship.size*.75,0);ctx.lineTo(ship.size*.15,-ship.size*.22);ctx.lineTo(ship.size*.15,ship.size*.22);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.restore();
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(8,VIEW_H-78,130,48);
  ctx.fillStyle='#aaa';ctx.font='9px system-ui';ctx.textAlign='left';
  ctx.fillText('⚡ '+globalPower.toFixed(0)+'/'+globalPowerCap.toFixed(0)+' (+'+globalPowerGen.toFixed(0)+')',12,VIEW_H-64);
  ctx.fillText('Волна '+waveNum+' · '+Math.ceil(waveTimer)+'с · враги '+enemies.length,12,VIEW_H-50);
  ctx.fillStyle='#8cf';ctx.fillText('F: '+selectedFilter+(shields.length?' · щит '+shields.length:''),12,VIEW_H-36);
  drawCoreInv();drawBuildMenu();drawBlockInfo();
  ctx.fillStyle=buildMode==='delete'?'rgba(180,30,30,.75)':'rgba(40,40,20,.6)';
  ctx.fillRect(VIEW_W/2-60,6,120,18);
  ctx.fillStyle=buildMode==='delete'?'#faa':'#fc6';ctx.font='bold 11px system-ui';ctx.textAlign='center';
  ctx.fillText(buildMode==='delete'?'СНОС':'СТРОЙКА',VIEW_W/2,18);
  ctx.textAlign='left';
}
let lastTime=performance.now();
function loop(now){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;update(dt);draw();requestAnimationFrame(loop)}
generateMap();spawnShip();requestAnimationFrame(loop);
