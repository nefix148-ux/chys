const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
let VIEW_W=0,VIEW_H=0;
function resize(){VIEW_W=window.innerWidth;VIEW_H=window.innerHeight;canvas.width=VIEW_W*devicePixelRatio;canvas.height=VIEW_H*devicePixelRatio;canvas.style.width=VIEW_W+'px';canvas.style.height=VIEW_H+'px';ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
window.addEventListener('resize',resize);resize();

let map=[],oreMap=[],buildMap=[],items=[],liquidItems=[];
let core={x:0,y:0};
let buildMode='place';
let selectedCategory=CATEGORIES.find(c=>c.id==='transport');
let selectedBlock=BTYPE.CONVEYOR;
let selectedDir=DIR.RIGHT;
let selectedConfig=null;
let blockScroll=0;
let ghosts=[];
let deleteSel=new Set();
let coreInventory={};
const shipCargo={type:null,amount:0};
let showCoreInv=false,showBlockInfo=false;
let globalPower=0,globalPowerCap=0,globalPowerUse=0,globalPowerGen=0;

function generateMap(){
  map=[];oreMap=[];buildMap=[];items=[];liquidItems=[];showCoreInv=false;ghosts=[];deleteSel.clear();
  for(let y=0;y<MAP_SIZE;y++){map[y]=[];oreMap[y]=[];buildMap[y]=[];for(let x=0;x<MAP_SIZE;x++){map[y][x]=BLOCK.DIRT;oreMap[y][x]=ORE.NONE;buildMap[y][x]=null}}
  for(let i=0;i<MAP_SIZE;i++)map[0][i]=map[MAP_SIZE-1][i]=map[i][0]=map[i][MAP_SIZE-1]=BLOCK.WALL;
  for(let l=0;l<12+Math.random()*8;l++){const cx=12+Math.floor(Math.random()*(MAP_SIZE-24)),cy=12+Math.floor(Math.random()*(MAP_SIZE-24)),r=5+Math.floor(Math.random()*11);for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){if(x<=0||y<=0||x>=MAP_SIZE-1||y>=MAP_SIZE-1)continue;if(Math.sqrt((x-cx)**2+(y-cy)**2)<r-Math.random()*2.8)map[y][x]=BLOCK.WATER}}
  for(let f=0;f<16+Math.random()*10;f++){const cx=10+Math.floor(Math.random()*(MAP_SIZE-20)),cy=10+Math.floor(Math.random()*(MAP_SIZE-20)),r=6+Math.floor(Math.random()*12);for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){if(x<=0||y<=0||x>=MAP_SIZE-1||y>=MAP_SIZE-1||map[y][x]===BLOCK.WATER)continue;if(Math.sqrt((x-cx)**2+(y-cy)**2)<r-Math.random()*3.5)map[y][x]=BLOCK.FERTILE}}
  for(let h=0;h<8+Math.random()*6;h++){const cx=10+Math.floor(Math.random()*(MAP_SIZE-20)),cy=10+Math.floor(Math.random()*(MAP_SIZE-20)),r=2+Math.floor(Math.random()*4);for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){if(x<=0||y<=0||x>=MAP_SIZE-1||y>=MAP_SIZE-1)continue;if(map[y][x]===BLOCK.WATER||map[y][x]===BLOCK.WALL)continue;if(Math.sqrt((x-cx)**2+(y-cy)**2)<r-Math.random()*1.5)map[y][x]=BLOCK.HOT}}
  core.x=Math.floor(MAP_SIZE/2);core.y=Math.floor(MAP_SIZE/2);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=core.x+dx,y=core.y+dy;if(x>0&&y>0&&x<MAP_SIZE-1&&y<MAP_SIZE-1)map[y][x]=BLOCK.CORE}
  const oreTypes=[{type:ORE.COPPER,count:12,minR:3,maxR:6},{type:ORE.LEAD,count:10,minR:3,maxR:6},{type:ORE.COAL,count:14,minR:3,maxR:7},{type:ORE.TITANIUM,count:7,minR:2,maxR:5},{type:ORE.THORIUM,count:5,minR:2,maxR:4},{type:ORE.METALOM,count:8,minR:2,maxR:5}];
  const centers=[];for(const ore of oreTypes){let pl=0,att=0;while(pl<ore.count&&att<ore.count*30){att++;const cx=10+Math.floor(Math.random()*(MAP_SIZE-20)),cy=10+Math.floor(Math.random()*(MAP_SIZE-20)),radius=ore.minR+Math.floor(Math.random()*(ore.maxR-ore.minR+1));if(centers.some(p=>Math.sqrt((cx-p.x)**2+(cy-p.y)**2)<radius+p.r+3))continue;if(Math.abs(cx-core.x)<radius+3&&Math.abs(cy-core.y)<radius+3)continue;let free=0,tot=0;for(let y=cy-radius;y<=cy+radius;y++)for(let x=cx-radius;x<=cx+radius;x++){if(x<=0||y<=0||x>=MAP_SIZE-1||y>=MAP_SIZE-1)continue;if(Math.sqrt((x-cx)**2+(y-cy)**2)>radius)continue;tot++;if(oreMap[y][x]===ORE.NONE&&(map[y][x]===BLOCK.DIRT||map[y][x]===BLOCK.FERTILE||map[y][x]===BLOCK.HOT))free++}if(tot===0||free/tot<.5)continue;for(let y=cy-radius;y<=cy+radius;y++)for(let x=cx-radius;x<=cx+radius;x++){if(x<=0||y<=0||x>=MAP_SIZE-1||y>=MAP_SIZE-1)continue;if(map[y][x]===BLOCK.WATER||map[y][x]===BLOCK.WALL||map[y][x]===BLOCK.CORE)continue;if(oreMap[y][x]!==ORE.NONE)continue;if(Math.sqrt((x-cx)**2+(y-cy)**2)<radius-Math.random()*1.8)oreMap[y][x]=ore.type}centers.push({x:cx,y:cy,r:radius});pl++}}
  RESOURCES.forEach(r=>coreInventory[r.id]=0);shipCargo.type=null;shipCargo.amount=0;
}

const ship={x:0,y:0,angle:-Math.PI/2,vx:0,vy:0,maxSpeed:2.4,accel:.12,friction:.95,size:13,homeForce:.035};
const camera={x:0,y:0,targetX:0,targetY:0};
const keys={};
let lastClickTime=0,lastClickTile=null;
let isDraggingCamera=false,lastTouchX=0,lastTouchY=0,dragStartX=0,dragStartY=0,didDrag=false,menuDown=false,lastPointerType='',listDragging=false,listDragY=0;

window.addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(e.code==='KeyR'){selectedDir=(selectedDir+1)%4;if(ghosts.length)ghosts[ghosts.length-1].dir=selectedDir}
  if(e.code==='Escape'){ghosts=[];deleteSel.clear();selectedBlock=null;showBlockInfo=false}
  if(e.code==='KeyQ')showBlockInfo=!showBlockInfo;
});
window.addEventListener('keyup',e=>{keys[e.code]=false});

function getTileFromScreen(sx,sy){return{x:Math.floor((sx+camera.x)/TILE),y:Math.floor((sy+camera.y)/TILE)}}
function distToCore(tx,ty){return Math.max(Math.abs(tx-core.x),Math.abs(ty-core.y))}
function tryMine(tx,ty){
  if(tx<=0||ty<=0||tx>=MAP_SIZE-1||ty>=MAP_SIZE-1)return;
  const ore=oreMap[ty][tx];
  const inCore=distToCore(tx,ty)<=CORE_RANGE;
  if(ore===ORE.NONE&&map[ty][tx]===BLOCK.FERTILE){
    if(inCore)coreInventory.sand=(coreInventory.sand||0)+1;
    else if((shipCargo.type===null||shipCargo.type==='sand')&&shipCargo.amount<PLAYER_MAX){shipCargo.type='sand';shipCargo.amount++}
    return;
  }
  if(ore===ORE.NONE||PLAYER_FORBIDDEN.has(ore))return;
  const resId=ORE_TO_ID[ore];
  if(inCore)coreInventory[resId]=(coreInventory[resId]||0)+1;
  else if((shipCargo.type===null||shipCargo.type===resId)&&shipCargo.amount<PLAYER_MAX){shipCargo.type=resId;shipCargo.amount++}
}
function canPlace(tx,ty,type,ignoreGhosts){
  const def=BUILDING_DEFS[type];if(!def)return false;const s=def.size;
  for(let dy=0;dy<s;dy++)for(let dx=0;dx<s;dx++){
    const x=tx+dx,y=ty+dy;
    if(x<=0||y<=0||x>=MAP_SIZE-1||y>=MAP_SIZE-1)return false;
    if(map[y][x]===BLOCK.WALL||map[y][x]===BLOCK.CORE)return false;
    const isPump=type===BTYPE.MECH_PUMP||type===BTYPE.ROTARY_PUMP||type===BTYPE.THERMAL_PUMP;
    if(map[y][x]===BLOCK.WATER&&!isPump)return false;
    if(buildMap[y][x])return false;
    if(!ignoreGhosts){for(const g of ghosts){const gs=BUILDING_DEFS[g.type]?.size||1;if(x>=g.x&&x<g.x+gs&&y>=g.y&&y<g.y+gs)return false}}
  }
  return true;
}
function isConveyorType(t){return t===BTYPE.CONVEYOR||t===BTYPE.TITANIUM_CONVEYOR||t===BTYPE.PLASTANIUM_CONVEYOR}
function detectIncomingDir(tx,ty){
  for(let d=0;d<4;d++){
    const ox=tx-DIR_DX[d],oy=ty-DIR_DY[d];
    const b=buildMap[oy]?.[ox];
    if(!b||b.type==='part')continue;
    if(isConveyorType(b.type)&&(b.dir??0)===d)return d;
  }
  return DIR.RIGHT;
}
function resolvePlaceDir(tx,ty,type,chosenDir){
  const def=BUILDING_DEFS[type];
  if(def?.directional&&isConveyorType(type))return chosenDir;
  if(def?.directional)return chosenDir;
  if(def?.category==='transport')return detectIncomingDir(tx,ty);
  return 0;
}
function placeBuilding(tx,ty,type,dir){
  if(!canPlace(tx,ty,type,true))return false;
  const def=BUILDING_DEFS[type];
  const finalDir=resolvePlaceDir(tx,ty,type,dir??0);
  const b={type,x:tx,y:ty,dir:finalDir,items:{},liquids:{},progress:0,power:0,timer:0};
  for(let dy=0;dy<def.size;dy++)for(let dx=0;dx<def.size;dx++){
    if(dx===0&&dy===0)buildMap[ty][tx]=b;
    else buildMap[ty+dy][tx+dx]={type:'part',parentX:tx,parentY:ty};
  }
  return true;
}
function getMainBuildingKey(tx,ty){
  const b=buildMap[ty]?.[tx];if(!b)return null;
  if(b.type==='part')return b.parentX+','+b.parentY;
  return tx+','+ty;
}
function removeBuildingAtKey(key){
  const [px,py]=key.split(',').map(Number);
  const b=buildMap[py]?.[px];if(!b||b.type==='part')return;
  const def=BUILDING_DEFS[b.type];if(!def)return;
  for(let dy=0;dy<def.size;dy++)for(let dx=0;dx<def.size;dx++)buildMap[py+dy][px+dx]=null;
}
function removeGhostAt(tx,ty){
  for(let i=ghosts.length-1;i>=0;i--){
    const g=ghosts[i];const s=BUILDING_DEFS[g.type]?.size||1;
    if(tx>=g.x&&tx<g.x+s&&ty>=g.y&&ty<g.y+s){ghosts.splice(i,1);return true}
  }
  return false;
}
function hasPending(){return ghosts.length>0||deleteSel.size>0}
const BTN_W=52,BTN_H=44,GAP=6;
function getMenuLayout(){
  const menuBottom=VIEW_H-10,modeY=menuBottom-BTN_H,modeX=VIEW_W-14-BTN_W;
  const catStartY=menuBottom-BTN_H*2-GAP*2;
  return{menuBottom,modeY,modeX,catStartY};
}
function getBuildMenuHit(mx,my){
  const L=getMenuLayout();
  if(mx>=L.modeX&&mx<=L.modeX+BTN_W&&my>=L.modeY&&my<=L.modeY+BTN_H)return{type:'mode'};
  const qY=L.modeY-BTN_H-GAP;
  if(mx>=L.modeX&&mx<=L.modeX+BTN_W&&my>=qY&&my<=qY+BTN_H)return{type:'info'};
  let leftX=L.modeX-BTN_W-GAP;
  if(hasPending()&&mx>=leftX&&mx<=leftX+BTN_W&&my>=L.modeY&&my<=L.modeY+BTN_H)return{type:'confirm'};
  if(hasPending())leftX-=BTN_W+GAP;
  if(buildMode==='place'&&selectedBlock&&isConveyorType(selectedBlock)){
    if(mx>=leftX&&mx<=leftX+BTN_W&&my>=L.modeY&&my<=L.modeY+BTN_H)return{type:'rotate'};
  }
  for(const cat of CATEGORIES){
    const col=cat.side==='left'?0:1;
    const bx=VIEW_W-14-(2-col)*(BTN_W+GAP);
    const by=L.catStartY-cat.row*(BTN_H+GAP);
    if(mx>=bx&&mx<=bx+BTN_W&&my>=by&&my<=by+BTN_H)return{type:'category',cat};
  }
  if(selectedCategory&&selectedCategory.blocks){
    const blocks=selectedCategory.blocks;
    const listW=BTN_W*3+GAP*2;
    const listX=VIEW_W-14-2*(BTN_W+GAP)-10-listW;
    const listY=L.catStartY-3*(BTN_H+GAP);
    const listH=4*(BTN_H+GAP)-GAP;
    if(mx>=listX&&mx<=listX+listW&&my>=listY&&my<=listY+listH){
      const col=Math.floor((mx-listX)/(BTN_W+GAP));
      const row=Math.floor((my-listY+blockScroll)/(BTN_H+GAP));
      const idx=row*3+col;
      if(idx>=0&&idx<blocks.length&&col>=0&&col<3)return{type:'block',block:blocks[idx]};
    }
  }
  if(mx>=10&&mx<=10+BTN_W&&my>=VIEW_H-10-BTN_H&&my<=VIEW_H-10)return{type:'clear'};
  return null;
}
function applyMenuHit(hit){
  if(!hit)return;
  if(hit.type==='mode'){
    if(buildMode==='place'){buildMode='delete'}else{buildMode='place';deleteSel.clear()}
  }else if(hit.type==='category'){
    selectedCategory=hit.cat;blockScroll=0;
    if(hit.cat.blocks.length){selectedBlock=hit.cat.blocks[0];buildMode='place';deleteSel.clear()}else selectedBlock=null;
  }else if(hit.type==='block'){
    selectedBlock=hit.block;buildMode='place';selectedDir=DIR.RIGHT;deleteSel.clear();showBlockInfo=false;
  }else if(hit.type==='rotate'){
    selectedDir=(selectedDir+1)%4;if(ghosts.length)ghosts[ghosts.length-1].dir=selectedDir;
  }else if(hit.type==='confirm'){
    if(buildMode==='place'&&ghosts.length){for(const g of ghosts)placeBuilding(g.x,g.y,g.type,g.dir);ghosts=[]}
    else if(buildMode==='delete'&&deleteSel.size){for(const key of [...deleteSel])removeBuildingAtKey(key);deleteSel.clear()}
  }else if(hit.type==='info'){showBlockInfo=!showBlockInfo}
  else if(hit.type==='clear'){ghosts=[];deleteSel.clear();selectedBlock=null;showBlockInfo=false}
}
function handlePointerDown(cx,cy,ptype){
  if(ptype==='mouse'&&lastPointerType==='touch')return;
  lastPointerType=ptype;
  dragStartX=cx;dragStartY=cy;didDrag=false;lastTouchX=cx;lastTouchY=cy;menuDown=false;listDragging=false;
  const hit=getBuildMenuHit(cx,cy);
  if(hit){
    if(hit.type==='block'||(selectedCategory&&selectedCategory.blocks)){
      const L=getMenuLayout();
      const listW=BTN_W*3+GAP*2;
      const listX=VIEW_W-14-2*(BTN_W+GAP)-10-listW;
      const listY=L.catStartY-3*(BTN_H+GAP);
      const listH=4*(BTN_H+GAP)-GAP;
      if(cx>=listX&&cx<=listX+listW&&cy>=listY&&cy<=listY+listH){
        listDragging=true;listDragY=cy;menuDown=true;
        window._pendingBlockHit=hit.type==='block'?hit:null;
        return;
      }
    }
    menuDown=true;applyMenuHit(hit);return;
  }
  isDraggingCamera=true;
}
function handlePointerMove(cx,cy){
  if(Math.abs(cx-dragStartX)>8||Math.abs(cy-dragStartY)>8)didDrag=true;
  if(listDragging){
    const dy=cy-listDragY;listDragY=cy;
    if(selectedCategory&&selectedCategory.blocks.length){
      const listH=4*(BTN_H+GAP)-GAP;
      const maxScroll=Math.max(0,Math.ceil(selectedCategory.blocks.length/3)*(BTN_H+GAP)-listH);
      blockScroll=Math.max(0,Math.min(maxScroll,blockScroll-dy));
    }
    return;
  }
  if(isDraggingCamera&&!menuDown){camera.targetX-=(cx-lastTouchX);camera.targetY-=(cy-lastTouchY);lastTouchX=cx;lastTouchY=cy}
}
function handlePointerUp(cx,cy,ptype){
  if(ptype==='mouse'&&lastPointerType==='touch')return;
  isDraggingCamera=false;
  if(listDragging){
    listDragging=false;
    if(!didDrag&&window._pendingBlockHit)applyMenuHit(window._pendingBlockHit);
    window._pendingBlockHit=null;menuDown=false;return;
  }
  if(menuDown){menuDown=false;return}
  if(didDrag)return;
  if(getBuildMenuHit(cx,cy))return;
  const tile=getTileFromScreen(cx,cy);
  if(tile.x<0||tile.y<0||tile.x>=MAP_SIZE||tile.y>=MAP_SIZE)return;
  if(removeGhostAt(tile.x,tile.y))return;
  const distShipToCore=Math.sqrt((ship.x-core.x)**2+(ship.y-core.y)**2);
  if(map[tile.y][tile.x]===BLOCK.CORE&&distShipToCore<=6){
    if(shipCargo.amount>0&&shipCargo.type){
      coreInventory[shipCargo.type]=(coreInventory[shipCargo.type]||0)+shipCargo.amount;
      shipCargo.type=null;shipCargo.amount=0;showCoreInv=true;return;
    }
    showCoreInv=!showCoreInv;return;
  }
  if(buildMode==='delete'){
    const key=getMainBuildingKey(tile.x,tile.y);
    if(key){if(deleteSel.has(key))deleteSel.delete(key);else deleteSel.add(key)}
    return;
  }
  if(buildMode==='place'&&selectedBlock){
    if(canPlace(tile.x,tile.y,selectedBlock))ghosts.push({x:tile.x,y:tile.y,type:selectedBlock,dir:selectedDir});
    return;
  }
  tryMine(tile.x,tile.y);
}
if(window.PointerEvent){
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType!=='touch')return;e.preventDefault();handlePointerDown(e.clientX,e.clientY,e.pointerType==='touch'?'touch':'mouse')});
  window.addEventListener('pointermove',e=>handlePointerMove(e.clientX,e.clientY));
  window.addEventListener('pointerup',e=>handlePointerUp(e.clientX,e.clientY,e.pointerType==='touch'?'touch':'mouse'));
}else{
  canvas.addEventListener('mousedown',e=>{if(e.button===0)handlePointerDown(e.clientX,e.clientY,'mouse')});
  window.addEventListener('mousemove',e=>handlePointerMove(e.clientX,e.clientY));
  window.addEventListener('mouseup',e=>handlePointerUp(e.clientX,e.clientY,'mouse'));
  canvas.addEventListener('touchstart',e=>{if(e.touches.length===1){e.preventDefault();handlePointerDown(e.touches[0].clientX,e.touches[0].clientY,'touch')}},{passive:false});
  canvas.addEventListener('touchmove',e=>{e.preventDefault();if(e.touches.length===1)handlePointerMove(e.touches[0].clientX,e.touches[0].clientY)},{passive:false});
  canvas.addEventListener('touchend',e=>{const t=e.changedTouches[0];handlePointerUp(t.clientX,t.clientY,'touch')});
}
canvas.addEventListener('wheel',e=>{
  if(selectedCategory&&selectedCategory.blocks.length){
    const listH=4*(BTN_H+GAP)-GAP;
    blockScroll=Math.max(0,Math.min(blockScroll+e.deltaY*0.5,Math.max(0,Math.ceil(selectedCategory.blocks.length/3)*(BTN_H+GAP)-listH)));
  }
},{passive:true});
function spawnShip(){ship.x=core.x+.5;ship.y=core.y-2.5;ship.vx=0;ship.vy=0;ship.angle=-Math.PI/2;camera.x=ship.x*TILE-VIEW_W/2;camera.y=ship.y*TILE-VIEW_H/2;camera.targetX=camera.x;camera.targetY=camera.y}
function countCoverage(x,y,size,pred){let n=0,tot=size*size;for(let dy=0;dy<size;dy++)for(let dx=0;dx<size;dx++)if(pred(x+dx,y+dy))n++;return{n,ratio:n/tot,tot}}
function addItem(b,id,amt){if(!b.items)b.items={};const def=BUILDING_DEFS[b.type];const cap=def?.itemCap||10;const cur=Object.values(b.items).reduce((a,v)=>a+v,0);const add=Math.min(amt,cap-cur);if(add>0)b.items[id]=(b.items[id]||0)+add;return add}
function takeItem(b,id,amt){if(!b.items)return 0;const have=b.items[id]||0;const t=Math.min(have,amt);if(t>0){b.items[id]-=t;if(b.items[id]<=0)delete b.items[id]}return t}
function addLiquid(b,id,amt){if(!b.liquids)b.liquids={};const def=BUILDING_DEFS[b.type];const cap=def?.liqCap||60;const cur=Object.values(b.liquids).reduce((a,v)=>a+v,0);const add=Math.min(amt,cap-cur);if(add>0)b.liquids[id]=(b.liquids[id]||0)+add;return add}
function takeLiquid(b,id,amt){if(!b.liquids)return 0;const have=b.liquids[id]||0;const t=Math.min(have,amt);if(t>0){b.liquids[id]-=t;if(b.liquids[id]<=0)delete b.liquids[id]}return t}
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
        if(tiles>0)addItem(b,res,baseRate*(tiles/(def.size*def.size))*rateMul*dt);
      }
      const totalItems=Object.values(b.items||{}).reduce((a,v)=>a+v,0);
      if(totalItems>=1){
        for(let d=0;d<4;d++){
          const nx=x+DIR_DX[d],ny=y+DIR_DY[d];
          const nb=buildMap[ny]?.[nx];
          if(nb&&nb.type!=='part'&&isConveyorType(nb.type)){
            for(const [rid,amt] of Object.entries(b.items)){
              if(amt>=1){const take=Math.floor(amt);if(takeItem(b,rid,take)===take)items.push({x:nx+.5,y:ny+.5,type:rid,progress:0,dir:nb.dir??d});break}
            }
            break;
          }
        }
      }
    }
    if(def.pumpRate){
      let waterTiles=0;
      for(let dy=0;dy<def.size;dy++)for(let dx=0;dx<def.size;dx++)if(map[y+dy]?.[x+dx]===BLOCK.WATER)waterTiles++;
      if(waterTiles>0)addLiquid(b,'water',def.pumpRate*(waterTiles/(def.size*def.size))*dt);
    }
    if(b.type===BTYPE.WATER_EXTRACTOR){
      let fert=0;for(let dy=0;dy<def.size;dy++)for(let dx=0;dx<def.size;dx++)if(map[y+dy]?.[x+dx]===BLOCK.FERTILE)fert++;
      if(fert>0)addLiquid(b,'water',6.6*(fert/(def.size*def.size))*dt);
    }
    if(def.recipe){
      const r=def.recipe;let can=true;
      for(const [id,need] of Object.entries(r.in)){
        const isLiq=RESOURCES.find(rr=>rr.id===id)?.liquid;
        if(isLiq){if((b.liquids?.[id]||0)<need)can=false}else{if((b.items?.[id]||0)<need)can=false}
      }
      if(can){
        b.progress=(b.progress||0)+dt;
        if(b.progress>=r.time){
          b.progress=0;
          for(const [id,need] of Object.entries(r.in)){const isLiq=RESOURCES.find(rr=>rr.id===id)?.liquid;if(isLiq)takeLiquid(b,id,need);else takeItem(b,id,need)}
          for(const [id,amt] of Object.entries(r.out)){const isLiq=RESOURCES.find(rr=>rr.id===id)?.liquid;if(isLiq)addLiquid(b,id,amt);else addItem(b,id,amt)}
        }
      }
    }
  }
  globalPower=Math.min(globalPowerCap,Math.max(0,globalPower+(globalPowerGen-globalPowerUse)*dt));
}
function updateItems(dt){}
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
  camera.x+=(camera.targetX-camera.x)*.18;camera.y+=(camera.targetY-camera.y)*.18;
  const maxX=MAP_SIZE*TILE-VIEW_W,maxY=MAP_SIZE*TILE-VIEW_H;
  camera.x=Math.max(0,Math.min(maxX,camera.x));camera.y=Math.max(0,Math.min(maxY,camera.y));
  camera.targetX=Math.max(0,Math.min(maxX,camera.targetX));camera.targetY=Math.max(0,Math.min(maxY,camera.targetY));
  updateBuildings(dt);updateItems(dt);
}
function drawIcon(x,y,size,type,color){ctx.save();ctx.translate(x,y);ctx.fillStyle=color;if(type==='liquid'){ctx.beginPath();ctx.ellipse(0,0,size*.35,size*.4,0,0,Math.PI*2);ctx.fill()}else ctx.fillRect(-size*.3,-size*.3,size*.6,size*.6);ctx.restore()}
function drawDirArrow(cx,cy,d,alpha){
  ctx.fillStyle='#fff';ctx.globalAlpha=alpha??.85;ctx.beginPath();
  if(d===DIR.RIGHT){ctx.moveTo(cx+6,cy);ctx.lineTo(cx-2,cy-5);ctx.lineTo(cx-2,cy+5)}
  else if(d===DIR.LEFT){ctx.moveTo(cx-6,cy);ctx.lineTo(cx+2,cy-5);ctx.lineTo(cx+2,cy+5)}
  else if(d===DIR.DOWN){ctx.moveTo(cx,cy+6);ctx.lineTo(cx-5,cy-2);ctx.lineTo(cx+5,cy-2)}
  else{ctx.moveTo(cx,cy-6);ctx.lineTo(cx-5,cy+2);ctx.lineTo(cx+5,cy+2)}
  ctx.closePath();ctx.fill();ctx.globalAlpha=1;
}
function drawBuildMenu(){
  const L=getMenuLayout();const isDel=buildMode==='delete';
  ctx.fillStyle=isDel?'rgba(255,50,50,.65)':'rgba(255,140,0,.5)';
  ctx.fillRect(L.modeX,L.modeY,BTN_W,BTN_H);
  ctx.strokeStyle=isDel?'#ff4444':'#ff8c00';ctx.lineWidth=2;ctx.strokeRect(L.modeX,L.modeY,BTN_W,BTN_H);
  ctx.fillStyle='#fff';ctx.font='18px system-ui';ctx.textAlign='center';ctx.fillText(isDel?'🗑':'🔨',L.modeX+BTN_W/2,L.modeY+26);
  const qY=L.modeY-BTN_H-GAP;
  ctx.fillStyle=showBlockInfo?'rgba(100,150,255,.5)':'rgba(40,40,50,.9)';
  ctx.fillRect(L.modeX,qY,BTN_W,BTN_H);ctx.strokeStyle=showBlockInfo?'#8af':'#666';ctx.strokeRect(L.modeX,qY,BTN_W,BTN_H);
  ctx.fillStyle='#fff';ctx.font='20px system-ui';ctx.fillText('?',L.modeX+BTN_W/2,qY+28);
  let leftX=L.modeX-BTN_W-GAP;
  if(hasPending()){
    ctx.fillStyle=isDel?'rgba(180,30,30,.95)':'rgba(30,140,30,.95)';
    ctx.fillRect(leftX,L.modeY,BTN_W,BTN_H);ctx.strokeStyle=isDel?'#f66':'#6f6';ctx.strokeRect(leftX,L.modeY,BTN_W,BTN_H);
    ctx.fillStyle='#fff';ctx.font='22px system-ui';ctx.fillText('✓',leftX+BTN_W/2,L.modeY+28);leftX-=BTN_W+GAP;
  }
  if(buildMode==='place'&&selectedBlock&&isConveyorType(selectedBlock)){
    ctx.fillStyle='rgba(50,50,80,.95)';ctx.fillRect(leftX,L.modeY,BTN_W,BTN_H);
    ctx.strokeStyle='#8af';ctx.strokeRect(leftX,L.modeY,BTN_W,BTN_H);
    ctx.fillStyle='#fff';ctx.font='22px system-ui';ctx.fillText(DIR_ARROW[selectedDir],leftX+BTN_W/2,L.modeY+28);
  }
  for(const cat of CATEGORIES){
    const col=cat.side==='left'?0:1;
    const bx=VIEW_W-14-(2-col)*(BTN_W+GAP);
    const by=L.catStartY-cat.row*(BTN_H+GAP);
    const active=selectedCategory===cat;
    ctx.fillStyle=active?'rgba(255,140,0,.4)':'rgba(30,30,35,.92)';
    ctx.fillRect(bx,by,BTN_W,BTN_H);ctx.strokeStyle=active?'#ff8c00':'#555';ctx.lineWidth=1;ctx.strokeRect(bx,by,BTN_W,BTN_H);
    ctx.fillStyle=active?'#ffcc66':'#aaa';ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText(cat.name.slice(0,6),bx+BTN_W/2,by+24);
  }
  if(selectedCategory){
    const blocks=selectedCategory.blocks||[];
    const listW=BTN_W*3+GAP*2;
    const listX=VIEW_W-14-2*(BTN_W+GAP)-10-listW;
    const listY=L.catStartY-3*(BTN_H+GAP);
    const listH=4*(BTN_H+GAP)-GAP;
    ctx.fillStyle='rgba(20,20,28,.94)';ctx.fillRect(listX-4,listY-4,listW+8,listH+8);
    ctx.strokeStyle='#444';ctx.strokeRect(listX-4,listY-4,listW+8,listH+8);
    if(!blocks.length){ctx.fillStyle='#666';ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText('пусто',listX+listW/2,listY+listH/2)}
    else{
      ctx.save();ctx.beginPath();ctx.rect(listX,listY,listW,listH);ctx.clip();
      blocks.forEach((bt,i)=>{
        const col=i%3,row=Math.floor(i/3);
        const bx=listX+col*(BTN_W+GAP),by=listY+row*(BTN_H+GAP)-blockScroll;
        if(by+BTN_H<listY||by>listY+listH)return;
        const d=BUILDING_DEFS[bt];const active=selectedBlock===bt;
        ctx.fillStyle=active?'rgba(100,180,255,.5)':'rgba(30,30,38,.95)';
        ctx.fillRect(bx,by,BTN_W,BTN_H);ctx.strokeStyle=active?'#6ab0ff':'#555';ctx.strokeRect(bx,by,BTN_W,BTN_H);
        ctx.fillStyle=d.color;ctx.fillRect(bx+6,by+5,BTN_W-12,12);
        ctx.fillStyle='#ccc';ctx.font='8px system-ui';ctx.textAlign='center';ctx.fillText(d.name.slice(0,7),bx+BTN_W/2,by+30);
      });
      ctx.restore();
    }
  }
  ctx.fillStyle='rgba(80,30,30,.9)';ctx.fillRect(10,VIEW_H-10-BTN_H,BTN_W,BTN_H);
  ctx.strokeStyle='#f66';ctx.lineWidth=2;ctx.strokeRect(10,VIEW_H-10-BTN_H,BTN_W,BTN_H);
  ctx.fillStyle='#fff';ctx.font='22px system-ui';ctx.textAlign='center';ctx.fillText('✕',10+BTN_W/2,VIEW_H-10-BTN_H+30);
  ctx.textAlign='left';ctx.lineWidth=1;
}
function drawBlockInfo(){
  if(!showBlockInfo||!selectedBlock)return;
  const def=BUILDING_DEFS[selectedBlock];if(!def)return;
  const w=Math.min(280,VIEW_W-40),pad=10;
  let lines=[def.name,def.desc||'',`Размер: ${def.size}x${def.size}`];
  if(def.itemCap)lines.push(`Предметы: ${def.itemCap}`);
  if(def.liqCap)lines.push(`Жидкости: ${def.liqCap}`);
  if(def.powerUse)lines.push(`Энергия: -${def.powerUse}/с`);
  if(def.powerGen)lines.push(`Генерация: +${def.powerGen}/с`);
  if(def.mine)lines.push('Добыча: '+Object.entries(def.mine).map(([k,v])=>k+':'+v).join(', '));
  if(def.recipe)lines.push('Рецепт: '+JSON.stringify(def.recipe.in)+' → '+JSON.stringify(def.recipe.out));
  const h=lines.length*16+pad*2;
  ctx.fillStyle='rgba(15,15,30,.95)';ctx.fillRect(12,50,w,h);ctx.strokeStyle='#6ab0ff';ctx.strokeRect(12,50,w,h);
  ctx.font='11px system-ui';lines.forEach((ln,i)=>{ctx.fillStyle=i===0?'#ffcc66':i===1?'#aaa':'#ccc';ctx.fillText(ln.slice(0,48),22,62+i*16)});
}
function drawLiquidCounters(){
  const liquids=['water','slag','oil','cryo'];
  const names={water:'Вода',slag:'Шлак',oil:'Нефть',cryo:'Крио'};
  const colors={water:'#4da6ff',slag:'#ff6a00',oil:'#2a1a0a',cryo:'#6ef0ff'};
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(8,40,148,liquids.length*18+8);
  liquids.forEach((id,i)=>{const v=Math.floor(coreInventory[id]||0);ctx.fillStyle=colors[id];ctx.fillRect(12,46+i*18,10,10);ctx.fillStyle='#ccc';ctx.font='11px system-ui';ctx.textAlign='left';ctx.fillText(names[id]+': '+v,26,55+i*18)});
}
function drawCoreInv(){
  if(!showCoreInv)return;
  const panelW=Math.min(220,VIEW_W*.42),rowH=22,pad=8,titleH=20;
  const coreItems=RESOURCES.filter(r=>(coreInventory[r.id]||0)>0);
  const coreH=titleH+Math.max(1,coreItems.length)*rowH+pad*2;
  ctx.fillStyle='rgba(15,15,25,.92)';ctx.fillRect(12,VIEW_H/2-coreH/2,panelW,coreH);
  ctx.strokeStyle='rgba(100,180,255,.6)';ctx.strokeRect(12,VIEW_H/2-coreH/2,panelW,coreH);
  ctx.fillStyle='#6ab0ff';ctx.font='bold 11px system-ui';ctx.fillText('ЯДРО',20,VIEW_H/2-coreH/2+14);
  if(!coreItems.length){ctx.fillStyle='#555';ctx.font='10px system-ui';ctx.fillText('пусто',20,VIEW_H/2-coreH/2+titleH+12)}
  else coreItems.forEach((res,i)=>{const ry=VIEW_H/2-coreH/2+titleH+pad+i*rowH;ctx.fillStyle=res.color;ctx.fillRect(20,ry+4,10,10);ctx.fillStyle='#ccc';ctx.font='10px system-ui';ctx.fillText(res.name+' '+Math.floor(coreInventory[res.id]),36,ry+13)});
}
function draw(){
  ctx.clearRect(0,0,VIEW_W,VIEW_H);
  const sTX=Math.max(0,Math.floor(camera.x/TILE)-1),sTY=Math.max(0,Math.floor(camera.y/TILE)-1);
  const eTX=Math.min(MAP_SIZE,Math.ceil((camera.x+VIEW_W)/TILE)+1),eTY=Math.min(MAP_SIZE,Math.ceil((camera.y+VIEW_H)/TILE)+1);
  for(let y=sTY;y<eTY;y++)for(let x=sTX;x<eTX;x++){
    const type=map[y][x],ore=oreMap[y][x],sx=x*TILE-camera.x,sy=y*TILE-camera.y;
    if(type===BLOCK.CORE){ctx.fillStyle='#1a1a2e';ctx.fillRect(sx,sy,TILE+.5,TILE+.5);ctx.fillStyle='#3a3a5c';ctx.fillRect(sx+2,sy+2,TILE-4,TILE-4)}
    else if(type===BLOCK.HOT){ctx.fillStyle='#c44a1a';ctx.fillRect(sx,sy,TILE+.5,TILE+.5)}
    else{ctx.fillStyle=COLORS[type]||'#333';ctx.fillRect(sx,sy,TILE+.5,TILE+.5)}
    if(ore!==ORE.NONE){ctx.fillStyle=ORE_COLORS[ore];ctx.globalAlpha=.85;ctx.fillRect(sx+1,sy+1,TILE-2,TILE-2);ctx.globalAlpha=1}
    const b=buildMap[y][x];
    if(b&&b.type!=='part'){
      const def=BUILDING_DEFS[b.type];
      if(def){
        const bw=TILE*def.size,bh=TILE*def.size;
        ctx.fillStyle=def.color;ctx.globalAlpha=.92;ctx.fillRect(sx+1,sy+1,bw-2,bh-2);ctx.globalAlpha=1;
        ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=2;ctx.strokeRect(sx+1.5,sy+1.5,bw-3,bh-3);
        if(def.size>1){ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(sx+3,sy+3,22,13);ctx.fillStyle='#fff';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText(def.size+'x'+def.size,sx+5,sy+13)}
        if(def.directional||isConveyorType(b.type))drawDirArrow(sx+bw/2,sy+bh/2,b.dir??0);
        const ic=Object.values(b.items||{}).reduce((a,v)=>a+v,0);
        if(ic>=1){ctx.fillStyle='#fff';ctx.font='bold 12px system-ui';ctx.fillText(String(Math.floor(ic)),sx+4,sy+bh-6)}
        const key=x+','+y;
        if(deleteSel.has(key)){ctx.strokeStyle='#ff2222';ctx.lineWidth=3;ctx.strokeRect(sx+.5,sy+.5,bw-1,bh-1)}
      }
    }else if(b&&b.type==='part'){
      const key=b.parentX+','+b.parentY;
      if(deleteSel.has(key)){ctx.strokeStyle='#ff2222';ctx.lineWidth=2;ctx.strokeRect(sx+1,sy+1,TILE-2,TILE-2)}
    }
  }
  for(const g of ghosts){
    const def=BUILDING_DEFS[g.type];if(!def)continue;
    const sx=g.x*TILE-camera.x,sy=g.y*TILE-camera.y;
    const bw=TILE*def.size,bh=TILE*def.size;
    ctx.fillStyle=def.color;ctx.globalAlpha=.4;ctx.fillRect(sx+1,sy+1,bw-2,bh-2);ctx.globalAlpha=1;
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(sx+1,sy+1,bw-2,bh-2);ctx.setLineDash([]);
    if(def.size>1){ctx.fillStyle='#fff';ctx.font='11px system-ui';ctx.fillText(def.size+'x'+def.size,sx+4,sy+14)}
    if(def.directional||isConveyorType(g.type))drawDirArrow(sx+bw/2,sy+bh/2,g.dir,.9);
  }
  for(const it of items){
    const res=RESOURCES.find(r=>r.id===it.type);if(!res)continue;
    ctx.fillStyle=res.color;ctx.beginPath();ctx.arc(it.x*TILE-camera.x,it.y*TILE-camera.y,5,0,Math.PI*2);ctx.fill();
  }
  const ssx=ship.x*TILE-camera.x,ssy=ship.y*TILE-camera.y;
  ctx.save();ctx.translate(ssx,ssy);ctx.rotate(ship.angle);
  ctx.fillStyle='#6a6a6a';ctx.beginPath();ctx.moveTo(ship.size,0);ctx.lineTo(-ship.size*.7,-ship.size*.55);ctx.lineTo(-ship.size*.4,0);ctx.lineTo(-ship.size*.7,ship.size*.55);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ff8c00';ctx.beginPath();ctx.moveTo(ship.size*.85,0);ctx.lineTo(ship.size*.2,-ship.size*.25);ctx.lineTo(ship.size*.2,ship.size*.25);ctx.closePath();ctx.fill();
  ctx.restore();
  if(shipCargo.amount>0&&shipCargo.type){
    const res=RESOURCES.find(r=>r.id===shipCargo.type);
    if(res){ctx.fillStyle=res.color;ctx.beginPath();ctx.arc(ssx,ssy-18,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(String(shipCargo.amount),ssx,ssy-15)}
  }
  ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(8,VIEW_H-70,120,28);
  ctx.fillStyle='#aaa';ctx.font='10px system-ui';ctx.fillText(`⚡ +${globalPowerGen.toFixed(0)} / -${globalPowerUse.toFixed(0)}`,12,VIEW_H-52);
  ctx.fillText(`🔋 ${globalPower.toFixed(0)}/${globalPowerCap.toFixed(0)}`,12,VIEW_H-38);
  drawLiquidCounters();drawCoreInv();drawBuildMenu();drawBlockInfo();
  ctx.fillStyle=buildMode==='delete'?'rgba(180,30,30,.75)':'rgba(40,40,20,.6)';
  ctx.fillRect(VIEW_W/2-70,8,140,22);
  ctx.fillStyle=buildMode==='delete'?'#faa':'#fc6';ctx.font='bold 12px system-ui';ctx.textAlign='center';
  ctx.fillText(buildMode==='delete'?'РЕЖИМ: СНОС':'РЕЖИМ: СТРОЙКА',VIEW_W/2,23);
  if(ghosts.length||deleteSel.size){
    ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(VIEW_W/2-110,34,220,18);
    ctx.fillStyle=buildMode==='delete'?'#f88':'#8f8';ctx.font='11px system-ui';
    ctx.fillText((buildMode==='delete'?'К сносу: ':'Призраков: ')+(buildMode==='delete'?deleteSel.size:ghosts.length)+' → ✓',VIEW_W/2,47);
  }
  ctx.textAlign='left';
}
let lastTime=performance.now();
function loop(now){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;update(dt);draw();requestAnimationFrame(loop)}
generateMap();spawnShip();requestAnimationFrame(loop);
