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
  const qY=L.catStartY-4*(BTN_H+GAP);
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
    ctx.fillStyle=active?'#ffcc66':'#aaa';ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText(cat.name.slice(0,7),bx+BTN_W/2,by+24);
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
        if(d){ctx.fillStyle=d.color;ctx.fillRect(bx+6,by+5,BTN_W-12,12);ctx.fillStyle='#ccc';ctx.font='8px system-ui';ctx.textAlign='center';ctx.fillText((d.name||'').slice(0,7),bx+BTN_W/2,by+30)}
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
