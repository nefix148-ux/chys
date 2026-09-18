function getBoostAt(tx,ty){
  let boost=1;
  for(let y=0;y<MAP_SIZE;y++)for(let x=0;x<MAP_SIZE;x++){
    const b=buildMap[y][x];if(!b||b.type==='part')continue;
    const def=BUILDING_DEFS[b.type];
    if(!def||!def.boost)continue;
    if(def.powerUse&&globalPower<1)continue;
    const cx=x+def.size/2,cy=y+def.size/2;
    if(Math.hypot(tx+0.5-cx,ty+0.5-cy)<=def.range)boost=Math.max(boost,def.boost);
  }
  return boost;
}
function shieldAbsorb(wx,wy,dmg){
  for(const s of shields){
    if(Math.hypot(wx-s.x,wy-s.y)<=s.range&&s.hp>0){
      s.hp-=dmg;
      return true;
    }
  }
  return false;
}
function findMassDrivers(){
  const list=[];
  for(let y=0;y<MAP_SIZE;y++)for(let x=0;x<MAP_SIZE;x++){
    const b=buildMap[y][x];if(!b||b.type==='part')continue;
    if(b.type===BTYPE.MASS_DRIVER)list.push(b);
  }
  return list;
}
function updateBuildings(dt){
  globalPowerGen=0;globalPowerUse=0;globalPowerCap=0;
  for(let y=0;y<MAP_SIZE;y++)for(let x=0;x<MAP_SIZE;x++){
    const b=buildMap[y][x];if(!b||b.type==='part')continue;
    const def=BUILDING_DEFS[b.type];if(!def)continue;
    if(def.powerCap)globalPowerCap+=def.powerCap;
    if(def.powerGen){let gen=def.powerGen;if(b.type===BTYPE.THERMAL_GEN){const cov=countCoverage(x,y,def.size,(tx,ty)=>map[ty]?.[tx]===BLOCK.HOT);gen*=cov.ratio||0}globalPowerGen+=gen}
    if(def.powerUse)globalPowerUse+=def.powerUse;
    if(def.mine){
      let rateMul=1;
      if(def.boostWater&&(b.liquids?.water||0)>=def.boostWater*dt){takeLiquid(b,'water',def.boostWater*dt);rateMul=def.boostMul||1}
      for(const [res,baseRate] of Object.entries(def.mine)){
        let tiles=0;
        for(let dy=0;dy<def.size;dy++)for(let dx=0;dx<def.size;dx++){
          const tx=x+dx,ty=y+dy;
          if(res==='sand'){if(map[ty]?.[tx]===BLOCK.FERTILE||map[ty]?.[tx]===BLOCK.DIRT)tiles++}
          else{const want=Object.keys(ORE_TO_ID).find(k=>ORE_TO_ID[k]===res);if(want!==undefined&&oreMap[ty]?.[tx]===Number(want))tiles++}
        }
        if(tiles>0)addItem(b,res,baseRate*(tiles/(def.size*def.size))*rateMul*getBoostAt(x,y)*dt);
      }
      for(const [rid,amt] of Object.entries(b.items||{})){
        if(amt<1)continue;
        let dumped=false;
        outer: for(let dy=-1;dy<=def.size;dy++)for(let dx=-1;dx<=def.size;dx++){
          if(dx>=0&&dx<def.size&&dy>=0&&dy<def.size)continue;
          const nx=x+dx,ny=y+dy;const nb=buildMap[ny]?.[nx];
          if(!nb||nb.type==='part')continue;
          if(isConveyorType(nb.type)){if(takeItem(b,rid,1)===1){items.push({x:nx+0.5,y:ny+0.5,type:rid,progress:0,dir:nb.dir??0});dumped=true;break outer}}
          else if((BUILDING_DEFS[nb.type]?.itemCap||0)>0){if(addItem(nb,rid,1)>0){takeItem(b,rid,1);dumped=true;break outer}}
        }
        if(dumped)break;
      }
    }
    if(def.pumpRate){let waterTiles=0;for(let dy=0;dy<def.size;dy++)for(let dx=0;dx<def.size;dx++)if(map[y+dy]?.[x+dx]===BLOCK.WATER)waterTiles++;if(waterTiles>0)addLiquid(b,'water',def.pumpRate*(waterTiles/(def.size*def.size))*dt)}
    if(b.type===BTYPE.WATER_EXTRACTOR){let fert=0;for(let dy=0;dy<def.size;dy++)for(let dx=0;dx<def.size;dx++)if(map[y+dy]?.[x+dx]===BLOCK.FERTILE)fert++;if(fert>0)addLiquid(b,'water',6.6*(fert/(def.size*def.size))*dt)}
    if(def.recipe){
      const r=def.recipe;let can=true;
      for(const [id,need] of Object.entries(r.in)){const isLiq=RESOURCES.find(rr=>rr.id===id)?.liquid;if(isLiq){if((b.liquids?.[id]||0)<need)can=false}else{if((b.items?.[id]||0)<need)can=false}}
      if(can){b.progress=(b.progress||0)+dt*getBoostAt(x,y);if(b.progress>=r.time){b.progress=0;for(const [id,need] of Object.entries(r.in)){const isLiq=RESOURCES.find(rr=>rr.id===id)?.liquid;if(isLiq)takeLiquid(b,id,need);else takeItem(b,id,need)}for(const [id,amt] of Object.entries(r.out)){const isLiq=RESOURCES.find(rr=>rr.id===id)?.liquid;if(isLiq)addLiquid(b,id,amt);else addItem(b,id,amt)}}}
    }
    if(def.range&&def.damage&&(def.ammo||def.liqAmmo||def.powerUse||def.category==='turret')){
      b.reload=(b.reload||0)-dt*getBoostAt(x,y);
      if(b.reload<=0){
        let target=null,best=def.range;
        for(const e of enemies){const dx=e.x-(x+def.size/2),dy=e.y-(y+def.size/2);const dist=Math.sqrt(dx*dx+dy*dy);if(dist<best){best=dist;target=e}}
        if(target){
          let canFire=true;
          if(def.powerUse&&globalPower<1)canFire=false;
          if(def.ammo){canFire=false;for(const a of def.ammo){if((b.items?.[a]||0)>=1){takeItem(b,a,1);canFire=true;break}}}
          if(def.liqAmmo){canFire=false;for(const a of def.liqAmmo){if((b.liquids?.[a]||0)>=1){takeLiquid(b,a,1);canFire=true;break}}}
          if(canFire){b.reload=def.reload||0.5;if(def.powerUse)globalPower=Math.max(0,globalPower-def.powerUse*0.05);const cx=x+def.size/2,cy=y+def.size/2;projectiles.push({x:cx,y:cy,tx:target.x,ty:target.y,dmg:def.damage,life:.35,color:def.color||'#fff'});target.hp-=def.damage}
        }
      }
    }
    if(def.heal&&def.range){
      if(!def.powerUse||globalPower>=def.powerUse*dt){
        if(def.powerUse)globalPower-=def.powerUse*dt;
        for(let yy=Math.max(0,y-def.range|0);yy<Math.min(MAP_SIZE,y+def.size+def.range);yy++)
          for(let xx=Math.max(0,x-def.range|0);xx<Math.min(MAP_SIZE,x+def.size+def.range);xx++){
            const nb=buildMap[yy]?.[xx];
            if(nb&&nb.type!=='part'&&nb.health!=null&&nb.health<nb.maxHealth)nb.health=Math.min(nb.maxHealth,nb.health+def.heal*dt);
          }
        for(const u of units){const dx=u.x-(x+def.size/2),dy=u.y-(y+def.size/2);if(Math.sqrt(dx*dx+dy*dy)<def.range)u.hp=Math.min(u.maxHp,u.hp+def.heal*dt)}
      }
    }
    if(def.unitType&&def.unitTime){
      const cost=def.unitCost||{};let can=true;
      for(const [id,need] of Object.entries(cost)){if((b.items?.[id]||0)<need)can=false}
      if(can&&(!def.powerUse||globalPower>=def.powerUse*dt)){
        b.progress=(b.progress||0)+dt*getBoostAt(x,y);if(def.powerUse)globalPower-=def.powerUse*dt;
        if(b.progress>=def.unitTime){b.progress=0;for(const [id,need] of Object.entries(cost))takeItem(b,id,need);const ud=UNIT_DEFS[def.unitType]||UNIT_DEFS.dagger;units.push({type:def.unitType,x:x+def.size+0.5,y:y+def.size/2,hp:ud.hp,maxHp:ud.hp,angle:0,reload:0})}
      }
    }
    if(def.shield&&def.range){
      if(!def.powerUse||globalPower>=def.powerUse*dt){
        if(def.powerUse)globalPower-=def.powerUse*dt;
        const cx=x+def.size/2,cy=y+def.size/2;
        let sh=shields.find(s=>s.bx===x&&s.by===y);
        if(!sh){sh={bx:x,by:y,x:cx,y:cy,range:def.range,hp:def.shield,maxHp:def.shield};shields.push(sh)}
        sh.x=cx;sh.y=cy;sh.range=def.range;
        if(sh.hp<sh.maxHp)sh.hp=Math.min(sh.maxHp,sh.hp+def.shield*0.05*dt);
      }
    }
    if(b.type===BTYPE.MASS_DRIVER){
      b.timer=(b.timer||0)-dt;
      const total=Object.values(b.items||{}).reduce((a,v)=>a+v,0);
      if(total>=1&&b.timer<=0&&globalPower>=10){
        const drivers=findMassDrivers().filter(d=>d!==b);
        let best=null,bd=def.range||55;
        for(const d of drivers){const dist=Math.hypot(d.x-b.x,d.y-b.y);if(dist>1&&dist<=bd){bd=dist;best=d}}
        if(best){
          for(const [rid,amt] of Object.entries(b.items)){
            if(amt>=1){
              takeItem(b,rid,1);
              items.push({x:b.x+1.5,y:b.y+1.5,type:rid,dir:0,mass:true,tx:best.x+1.5,ty:best.y+1.5,life:1});
              b.timer=1.2;globalPower-=10;break;
            }
          }
        }
      }
    }
    if(b.type===BTYPE.UNLOADER){
      b.timer=(b.timer||0)-dt;
      if(b.timer<=0){
        for(let d=0;d<4;d++){
          const nx=x+DIR_DX[d],ny=y+DIR_DY[d];
          if(map[ny]?.[nx]===BLOCK.CORE){
            const filt=b.filter||selectedFilter;
            if((coreInventory[filt]||0)>=1){
              coreInventory[filt]--;
              for(let d2=0;d2<4;d2++){
                const cx2=x+DIR_DX[d2],cy2=y+DIR_DY[d2];
                const nb=buildMap[cy2]?.[cx2];
                if(nb&&isConveyorType(nb.type)){items.push({x:cx2+0.5,y:cy2+0.5,type:filt,dir:nb.dir??0});b.timer=0.15;break}
              }
            }
            break;
          }
          const nb=buildMap[ny]?.[nx];
          if(nb&&nb.type!=='part'&&(BUILDING_DEFS[nb.type]?.itemCap||0)>=20){
            for(const [rid,amt] of Object.entries(nb.items||{})){
              if(amt>=1){
                takeItem(nb,rid,1);
                for(let d2=0;d2<4;d2++){
                  const cx2=x+DIR_DX[d2],cy2=y+DIR_DY[d2];
                  const cb=buildMap[cy2]?.[cx2];
                  if(cb&&isConveyorType(cb.type)){items.push({x:cx2+0.5,y:cy2+0.5,type:rid,dir:cb.dir??0});b.timer=0.15;break}
                }
                break;
              }
            }
          }
        }
      }
    }
    if(def.reconTier){
      b.timer=(b.timer||0)-dt;
      if(b.timer<=0&&globalPower>=(def.powerUse||0)*0.5){
        const cx=x+def.size/2,cy=y+def.size/2;
        for(const u of units){
          const ud=UNIT_DEFS[u.type];
          if(!ud||ud.tier!==def.reconTier)continue;
          const next=UPGRADE_MAP[u.type];
          if(!next||!UNIT_DEFS[next])continue;
          if(Math.hypot(u.x-cx,u.y-cy)<def.size){
            const nd=UNIT_DEFS[next];
            u.type=next;u.hp=nd.hp;u.maxHp=nd.hp;
            b.timer=def.unitTime||20;
            globalPower=Math.max(0,globalPower-(def.powerUse||0));
            break;
          }
        }
      }
    }
    if(b.type===BTYPE.SHOCK_MINE){
      for(const e of enemies){
        if(Math.hypot(e.x-(x+0.5),e.y-(y+0.5))<1.2){
          e.hp-=def.damage||60;
          for(const e2 of enemies){if(Math.hypot(e2.x-e.x,e2.y-e.y)<2.5)e2.hp-=20}
          removeBuildingAtKey(x+','+y);
          break;
        }
      }
    }
  }
  shields=shields.filter(s=>{
    const b=buildMap[s.by]?.[s.bx];
    return b&&b.type!=='part'&&BUILDING_DEFS[b.type]?.shield&&s.hp>0;
  });
  globalPower=Math.min(globalPowerCap,Math.max(0,globalPower+(globalPowerGen-globalPowerUse)*dt));
}
function acceptItem(b,id,amt){if(!b||b.type==='part')return 0;const def=BUILDING_DEFS[b.type];if(!def)return 0;if(isConveyorType(b.type))return 0;return addItem(b,id,amt)}
function updateItems(dt){
  for(let i=items.length-1;i>=0;i--){
    const it=items[i];
    if(it.mass){
      const dx=it.tx-it.x,dy=it.ty-it.y,dist=Math.hypot(dx,dy)||1;
      it.x+=dx/dist*dt*25;it.y+=dy/dist*dt*25;
      if(dist<0.4){
        const bx=Math.floor(it.tx),by=Math.floor(it.ty);
        const b=buildMap[by]?.[bx];
        if(b&&b.type!=='part')addItem(b,it.type,1);
        items.splice(i,1);
      }
      continue;
    }
    const tx=Math.floor(it.x),ty=Math.floor(it.y);const b=buildMap[ty]?.[tx];let speed=0.08;
    if(b&&b.type!=='part'&&isConveyorType(b.type)){const def=BUILDING_DEFS[b.type];speed=def.speed||0.08;it.dir=b.dir??it.dir??0}
    else if(b&&b.type!=='part'){
      if(b.type===BTYPE.SORTER||b.type===BTYPE.INV_SORTER){
        const filt=b.filter||selectedFilter;
        const forward=b.dir??0;
        let outDir=forward;
        if(b.type===BTYPE.SORTER)outDir=(it.type===filt)?forward:(forward+1)%4;
        else outDir=(it.type===filt)?(forward+1)%4:forward;
        const ox=tx+DIR_DX[outDir],oy=ty+DIR_DY[outDir];
        const ob=buildMap[oy]?.[ox];
        if(ob&&isConveyorType(ob.type)){it.x=ox+0.5;it.y=oy+0.5;it.dir=ob.dir??outDir;continue}
      }
      if(acceptItem(b,it.type,1)>=1){items.splice(i,1);continue}
      continue;
    }
    else{
      let bridged=false;
      for(let y=0;y<MAP_SIZE&&!bridged;y++)for(let x=0;x<MAP_SIZE&&!bridged;x++){
        const br=buildMap[y][x];if(!br||br.type==='part')continue;
        const d=BUILDING_DEFS[br.type];
        if((br.type===BTYPE.BRIDGE||br.type===BTYPE.PHASE_BRIDGE)&&d.range){
          if(tx===x&&ty===y){
            const dir=br.dir??0;
            for(let dist=1;dist<=d.range;dist++){
              const dx=x+DIR_DX[dir]*dist,dy=y+DIR_DY[dir]*dist;
              const dest=buildMap[dy]?.[dx];
              if(dest&&(dest.type===BTYPE.BRIDGE||dest.type===BTYPE.PHASE_BRIDGE||isConveyorType(dest.type))){
                it.x=dx+0.5;it.y=dy+0.5;it.dir=dest.dir??dir;bridged=true;break;
              }
            }
          }
        }
      }
      if(!bridged)items.splice(i,1);
      continue;
    }
    const d=it.dir??0;const nx=it.x+DIR_DX[d]*speed*dt*60;const ny=it.y+DIR_DY[d]*speed*dt*60;const ntx=Math.floor(nx),nty=Math.floor(ny);
    if(ntx===tx&&nty===ty){it.x=nx;it.y=ny;continue}
    const nb=buildMap[nty]?.[ntx];
    if(nb&&nb.type!=='part'&&isConveyorType(nb.type)){it.x=nx;it.y=ny;it.dir=nb.dir??d;continue}
    if(nb&&nb.type!=='part'){if(acceptItem(nb,it.type,1)>=1){items.splice(i,1);continue}continue}
  }
}
function update(dt){
  let ix=0,iy=0;
  if(keys['KeyA']||keys['ArrowLeft'])ix-=1;if(keys['KeyD']||keys['ArrowRight'])ix+=1;
  if(keys['KeyW']||keys['ArrowUp'])iy-=1;if(keys['KeyS']||keys['ArrowDown'])iy+=1;
  const len=Math.sqrt(ix*ix+iy*iy);if(len>1){ix/=len;iy/=len}
  if(len>.1){ship.vx+=ix*ship.accel;ship.vy+=iy*ship.accel}
  const cx=(camera.x+VIEW_W/2)/TILE,cy=(camera.y+VIEW_H/2)/TILE;
  const dx=cx-ship.x,dy=cy-ship.y,dist=Math.sqrt(dx*dx+dy*dy);
  if(dist>.8){const f=Math.min(dist*ship.homeForce,.12);ship.vx+=(dx/dist)*f;ship.vy+=(dy/dist)*f}
  ship.vx*=ship.friction;ship.vy*=ship.friction;
  const spd=Math.sqrt(ship.vx*ship.vx+ship.vy*ship.vy);
  if(spd>ship.maxSpeed){ship.vx=ship.vx/spd*ship.maxSpeed;ship.vy=ship.vy/spd*ship.maxSpeed}
  ship.x+=ship.vx*dt*60;ship.y+=ship.vy*dt*60;
  ship.x=Math.max(.5,Math.min(MAP_SIZE-.5,ship.x));ship.y=Math.max(.5,Math.min(MAP_SIZE-.5,ship.y));
  if(spd>.12){const t=Math.atan2(ship.vy,ship.vx);let d=t-ship.angle;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;ship.angle+=d*.2}
  camera.zoom+=(camera.targetZoom-camera.zoom)*0.15;
  camera.x+=(camera.targetX-camera.x)*.18;camera.y+=(camera.targetY-camera.y)*.18;
  const viewW=VIEW_W/camera.zoom,viewH=VIEW_H/camera.zoom;
  const camCenterX=camera.x+VIEW_W/2,camCenterY=camera.y+VIEW_H/2;
  const ncx=Math.max(viewW/2,Math.min(MAP_SIZE*TILE-viewW/2,camCenterX));
  const ncy=Math.max(viewH/2,Math.min(MAP_SIZE*TILE-viewH/2,camCenterY));
  camera.x=ncx-VIEW_W/2;camera.y=ncy-VIEW_H/2;
  const tcx=camera.targetX+VIEW_W/2,tcy=camera.targetY+VIEW_H/2;
  camera.targetX=Math.max(viewW/2,Math.min(MAP_SIZE*TILE-viewW/2,tcx))-VIEW_W/2;
  camera.targetY=Math.max(viewH/2,Math.min(MAP_SIZE*TILE-viewH/2,tcy))-VIEW_H/2;
  animTime+=dt;gameTime+=dt;
  if(typeof tryDepositToCore==='function')tryDepositToCore();
  waveTimer-=dt;
  if(waveTimer<=0){
    waveNum++;waveTimer=20+waveNum*2;const n=3+waveNum*2;
    for(let i=0;i<n;i++){
      const side=Math.floor(Math.random()*4);let ex,ey;
      if(side===0){ex=2;ey=Math.random()*MAP_SIZE}else if(side===1){ex=MAP_SIZE-3;ey=Math.random()*MAP_SIZE}else if(side===2){ex=Math.random()*MAP_SIZE;ey=2}else{ex=Math.random()*MAP_SIZE;ey=MAP_SIZE-3}
      const heavy=waveNum>=3&&Math.random()<0.3;
      const ud=heavy?UNIT_DEFS.enemy2:UNIT_DEFS.enemy;
      enemies.push({x:ex,y:ey,hp:ud.hp+waveNum*12,maxHp:ud.hp+waveNum*12,reload:0,type:heavy?'enemy2':'enemy'});
    }
  }
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];if(e.hp<=0){enemies.splice(i,1);continue}
    const edx=core.x+0.5-e.x,edy=core.y+0.5-e.y;const edist=Math.sqrt(edx*edx+edy*edy)||1;
    e.x+=edx/edist*0.6*dt*60*0.015;e.y+=edy/edist*0.6*dt*60*0.015;
    e.reload=(e.reload||0)-dt;
    if(e.reload<=0){
      const tx=Math.floor(e.x),ty=Math.floor(e.y);
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
        const bb=buildMap[ty+oy]?.[tx+ox];
        if(bb&&bb.type!=='part'){
          const main=bb;if(main&&main.health!=null){if(!shieldAbsorb(e.x,e.y,8)){main.health-=8;if(main.health<=0)removeBuildingAtKey(main.x+','+main.y)}e.reload=0.8;break}
        }
      }
    }
  }
  for(let i=units.length-1;i>=0;i--){
    const u=units[i];if(u.hp<=0){units.splice(i,1);continue}
    const ud=UNIT_DEFS[u.type]||UNIT_DEFS.dagger;
    let target=null,best=ud.range||12;
    for(const e of enemies){const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<best){best=d;target=e}}
    if(target){
      const udx=target.x-u.x,udy=target.y-u.y,udd=Math.hypot(udx,udy)||1;
      if(udd>best*0.7){u.x+=udx/udd*ud.speed*dt*0.8;u.y+=udy/udd*ud.speed*dt*0.8}
      u.angle=Math.atan2(udy,udx);u.reload=(u.reload||0)-dt;
      if(u.reload<=0&&udd<=ud.range){u.reload=0.6;target.hp-=ud.damage;projectiles.push({x:u.x,y:u.y,tx:target.x,ty:target.y,dmg:ud.damage,life:.25,color:ud.color})}
    }
  }
  for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.life-=dt;const pdx=p.tx-p.x,pdy=p.ty-p.y,pd=Math.hypot(pdx,pdy)||1;p.x+=pdx/pd*dt*40;p.y+=pdy/pd*dt*40;if(p.life<=0)projectiles.splice(i,1)}
  updateBuildings(dt);updateItems(dt);
}
