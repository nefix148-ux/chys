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
    ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(sx+4,sy+4,t*0.3,t*0.2);
  }else if(type===BLOCK.FERTILE){
    ctx.fillStyle='#4a6b3a';ctx.fillRect(sx,sy,t+.5,t+.5);
    ctx.fillStyle='rgba(90,140,50,.35)';ctx.fillRect(sx+2,sy+2,t-4,t-4);
  }else if(type===BLOCK.WALL){
    ctx.fillStyle='#3a3a3a';ctx.fillRect(sx,sy,t+.5,t+.5);
    ctx.fillStyle='#505050';ctx.fillRect(sx+2,sy+2,t-4,t-4);
  }else{
    ctx.fillStyle=COLORS[type]||'#5c4030';ctx.fillRect(sx,sy,t+.5,t+.5);
    ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(sx,sy+t*0.6,t,t*0.4);
  }
  if(ore!==ORE.NONE){
    const oc=ORE_COLORS[ore];
    ctx.fillStyle=oc;ctx.globalAlpha=.9;
    const m=t*0.18;
    ctx.beginPath();
    ctx.moveTo(sx+t/2,sy+m);ctx.lineTo(sx+t-m,sy+t/2);ctx.lineTo(sx+t/2,sy+t-m);ctx.lineTo(sx+m,sy+t/2);
    ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(sx+t*0.4,sy+t*0.4,t*0.08,0,Math.PI*2);ctx.fill();
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
  for(let y=sTY;y<eTY;y++)for(let x=sTX;x<eTX;x++){
    drawTile(map[y][x],oreMap[y][x],x*TILE,y*TILE);
  }
  for(let y=sTY;y<eTY;y++)for(let x=sTX;x<eTX;x++){
    const b=buildMap[y][x];
    if(!b||b.type==='part')continue;
    const def=BUILDING_DEFS[b.type];
    if(!def)continue;
    const sx=x*TILE,sy=y*TILE;
    const bw=TILE*def.size,bh=TILE*def.size;
    ctx.fillStyle='rgba(0,0,0,.28)';
    ctx.fillRect(sx+3,sy+4,bw-2,bh-2);
    ctx.fillStyle=def.color;
    ctx.globalAlpha=.96;
    ctx.fillRect(sx+1,sy+1,bw-2,bh-2);
    ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(255,255,255,.22)';
    ctx.lineWidth=1.5;
    ctx.strokeRect(sx+2,sy+2,bw-4,bh-4);
    ctx.strokeStyle='rgba(0,0,0,.55)';
    ctx.lineWidth=2;
    ctx.strokeRect(sx+1,sy+1,bw-2,bh-2);
    if(def.size>1){
      ctx.fillStyle='rgba(0,0,0,.45)';
      ctx.fillRect(sx+4,sy+4,28,15);
      ctx.fillStyle='#ffe8a0';
      ctx.font='bold 11px system-ui';
      ctx.textAlign='left';
      ctx.fillText(def.size+'\u00d7'+def.size,sx+6,sy+15);
    }
    if(isConveyorType(b.type)){
      const d=b.dir??0;
      ctx.save();
      ctx.beginPath();ctx.rect(sx+3,sy+3,bw-6,bh-6);ctx.clip();
      const spd=(def.speed||0.08)*80;
      const off=(animTime*spd*TILE)%(TILE*0.35);
      ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=3;
      if(d===0||d===2){
        for(let i=-1;i<5;i++){
          const px=sx+(d===0?off:-off)+i*(TILE*0.35);
          ctx.beginPath();ctx.moveTo(px,sy+4);ctx.lineTo(px+8,sy+bh/2);ctx.lineTo(px,sy+bh-4);ctx.stroke();
        }
      }else{
        for(let i=-1;i<5;i++){
          const py=sy+(d===1?off:-off)+i*(TILE*0.35);
          ctx.beginPath();ctx.moveTo(sx+4,py);ctx.lineTo(sx+bw/2,py+8);ctx.lineTo(sx+bw-4,py);ctx.stroke();
        }
      }
      ctx.restore();
      drawDirArrow(sx+bw/2,sy+bh/2,d);
    }else if(def.directional){
      drawDirArrow(sx+bw/2,sy+bh/2,b.dir??0);
    }
    if(def.mine){
      const cx=sx+bw/2,cy=sy+bh/2;
      const ang=animTime*6;
      ctx.strokeStyle='rgba(255,200,80,.75)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(cx,cy,Math.min(bw,bh)*0.28,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(ang)*bw*0.12,cy+Math.sin(ang)*bh*0.12);
      ctx.lineTo(cx+Math.cos(ang+Math.PI)*bw*0.12,cy+Math.sin(ang+Math.PI)*bh*0.12);
      ctx.moveTo(cx+Math.cos(ang+Math.PI/2)*bw*0.12,cy+Math.sin(ang+Math.PI/2)*bh*0.12);
      ctx.lineTo(cx+Math.cos(ang+Math.PI*1.5)*bw*0.12,cy+Math.sin(ang+Math.PI*1.5)*bh*0.12);
      ctx.stroke();
      const p=0.35+0.25*Math.sin(animTime*4);
      ctx.strokeStyle=`rgba(255,180,60,${p})`;
      ctx.strokeRect(sx+3,sy+3,bw-6,bh-6);
    }
    const ic=Object.values(b.items||{}).reduce((a,v)=>a+v,0);
    if(ic>=0.5){
      ctx.fillStyle='#fff';
      ctx.font='bold 13px system-ui';
      ctx.fillText(String(Math.floor(ic)),sx+5,sy+bh-7);
    }
    const key=x+','+y;
    if(deleteSel.has(key)){
      ctx.strokeStyle='#ff2222';
      ctx.lineWidth=3;
      ctx.strokeRect(sx+.5,sy+.5,bw-1,bh-1);
      ctx.fillStyle='rgba(255,40,40,.18)';
      ctx.fillRect(sx+1,sy+1,bw-2,bh-2);
    }
  }
  for(const gh of ghosts){
    const def=BUILDING_DEFS[gh.type];if(!def)continue;
    const sx=gh.x*TILE,sy=gh.y*TILE;
    const bw=TILE*def.size,bh=TILE*def.size;
    const pulse=0.3+0.15*Math.sin(animTime*5);
    ctx.fillStyle=def.color;ctx.globalAlpha=pulse;ctx.fillRect(sx+1,sy+1,bw-2,bh-2);ctx.globalAlpha=1;
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(sx+1,sy+1,bw-2,bh-2);ctx.setLineDash([]);
    if(def.size>1){ctx.fillStyle='#fff';ctx.font='11px system-ui';ctx.fillText(def.size+'\u00d7'+def.size,sx+4,sy+14)}
    if(def.directional||isConveyorType(gh.type))drawDirArrow(sx+bw/2,sy+bh/2,gh.dir,.9);
  }
  for(const it of items){
    const res=RESOURCES.find(r=>r.id===it.type);if(!res)continue;
    const ix=it.x*TILE,iy=it.y*TILE;
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(ix+1.5,iy+2,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=res.color;ctx.beginPath();ctx.arc(ix,iy,7,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.arc(ix-2,iy-2,2.5,0,Math.PI*2);ctx.fill();
  }
  const ssx=ship.x*TILE,ssy=ship.y*TILE;
  ctx.save();ctx.translate(ssx,ssy);ctx.rotate(ship.angle);
  const thrust=Math.min(1,Math.hypot(ship.vx,ship.vy)/ship.maxSpeed);
  if(thrust>0.05){
    const eg=ctx.createRadialGradient(-ship.size*0.5,0,0,-ship.size*0.5,0,ship.size*0.9);
    eg.addColorStop(0,`rgba(255,160,40,${0.5*thrust})`);eg.addColorStop(1,'rgba(255,80,0,0)');
    ctx.fillStyle=eg;ctx.beginPath();ctx.arc(-ship.size*0.45,0,ship.size*0.85,0,Math.PI*2);ctx.fill();
  }
  const body=ctx.createLinearGradient(-ship.size,0,ship.size,0);
  body.addColorStop(0,'#4a4a52');body.addColorStop(0.5,'#8a8a92');body.addColorStop(1,'#5a5a62');
  ctx.fillStyle=body;
  ctx.beginPath();
  ctx.moveTo(ship.size,0);
  ctx.lineTo(-ship.size*.65,-ship.size*.55);
  ctx.lineTo(-ship.size*.35,0);
  ctx.lineTo(-ship.size*.65,ship.size*.55);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='#ff8c00';
  ctx.beginPath();ctx.moveTo(ship.size*.75,0);ctx.lineTo(ship.size*.15,-ship.size*.22);ctx.lineTo(ship.size*.15,ship.size*.22);ctx.closePath();ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.arc(ship.size*.2,0,ship.size*.12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffcc66';ctx.beginPath();ctx.arc(ship.size*.2,0,ship.size*.07,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff8c00';ctx.globalAlpha=.7;
  ctx.fillRect(-ship.size*.5,-ship.size*.5,ship.size*.15,ship.size*.12);
  ctx.fillRect(-ship.size*.5,ship.size*.38,ship.size*.15,ship.size*.12);
  ctx.globalAlpha=1;
  ctx.restore();
  if(shipCargo.amount>0&&shipCargo.type){
    const res=RESOURCES.find(r=>r.id===shipCargo.type);
    if(res){
      ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.arc(ssx+1,ssy-ship.size-6,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=res.color;ctx.beginPath();ctx.arc(ssx,ssy-ship.size-7,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(String(shipCargo.amount),ssx,ssy-ship.size-4);
    }
  }
  ctx.restore();
  ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(8,VIEW_H-70,130,42);
  ctx.fillStyle='#aaa';ctx.font='10px system-ui';ctx.fillText(`+${globalPowerGen.toFixed(0)} / -${globalPowerUse.toFixed(0)}`,12,VIEW_H-52);
  ctx.fillText(`${globalPower.toFixed(0)}/${globalPowerCap.toFixed(0)}`,12,VIEW_H-38);
  ctx.fillText(`${Math.round(camera.zoom*100)}%`,12,VIEW_H-24);
  drawLiquidCounters();drawCoreInv();drawBuildMenu();drawBlockInfo();
  ctx.fillStyle=buildMode==='delete'?'rgba(180,30,30,.75)':'rgba(40,40,20,.6)';
  ctx.fillRect(VIEW_W/2-70,8,140,22);
  ctx.fillStyle=buildMode==='delete'?'#faa':'#fc6';ctx.font='bold 12px system-ui';ctx.textAlign='center';
  ctx.fillText(buildMode==='delete'?'СНОС':'СТРОЙКА',VIEW_W/2,23);
  if(ghosts.length||deleteSel.size){
    ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(VIEW_W/2-110,34,220,18);
    ctx.fillStyle=buildMode==='delete'?'#f88':'#8f8';ctx.font='11px system-ui';
    ctx.fillText((buildMode==='delete'?'К сносу: ':'Призраков: ')+(buildMode==='delete'?deleteSel.size:ghosts.length)+' -> OK',VIEW_W/2,47);
  }
  ctx.textAlign='left';
}
let lastTime=performance.now();
function loop(now){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;update(dt);draw();requestAnimationFrame(loop)}
generateMap();spawnShip();requestAnimationFrame(loop);
