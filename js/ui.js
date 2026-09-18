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
  ctx.fillStyle=isDel?'rgba(200,40,40,.85)':'rgba(200,110,0,.75)';
  ctx.fillRect(L.modeX,L.modeY,BTN_W,BTN_H);
  ctx.strokeStyle=isDel?'#f55':'#fc6';ctx.lineWidth=1.5;ctx.strokeRect(L.modeX,L.modeY,BTN_W,BTN_H);
  ctx.fillStyle='#fff';ctx.font='15px system-ui';ctx.textAlign='center';
  ctx.fillText(isDel?'🗑':'🔨',L.modeX+BTN_W/2,L.modeY+BTN_H/2+5);
  const maxRow=CATEGORIES.reduce((m,c)=>Math.max(m,c.row||0),0);
  const qY=L.catStartY-(maxRow+1)*(BTN_H+GAP);
  ctx.fillStyle=showBlockInfo?'rgba(80,120,220,.55)':'rgba(30,30,40,.9)';
  ctx.fillRect(L.modeX,qY,BTN_W,BTN_H);
  ctx.strokeStyle=showBlockInfo?'#8af':'#555';ctx.strokeRect(L.modeX,qY,BTN_W,BTN_H);
  ctx.fillStyle='#fff';ctx.font='16px system-ui';ctx.fillText('?',L.modeX+BTN_W/2,qY+BTN_H/2+5);
  let leftX=L.modeX-BTN_W-GAP;
  if(hasPending()){
    ctx.fillStyle=isDel?'rgba(160,30,30,.95)':'rgba(30,130,30,.95)';
    ctx.fillRect(leftX,L.modeY,BTN_W,BTN_H);
    ctx.strokeStyle=isDel?'#f66':'#6f6';ctx.strokeRect(leftX,L.modeY,BTN_W,BTN_H);
    ctx.fillStyle='#fff';ctx.font='18px system-ui';ctx.fillText('✓',leftX+BTN_W/2,L.modeY+BTN_H/2+6);
    leftX-=BTN_W+GAP;
  }
  if(buildMode==='place'&&selectedBlock&&isConveyorType(selectedBlock)){
    ctx.fillStyle='rgba(40,40,70,.95)';ctx.fillRect(leftX,L.modeY,BTN_W,BTN_H);
    ctx.strokeStyle='#8af';ctx.strokeRect(leftX,L.modeY,BTN_W,BTN_H);
    ctx.fillStyle='#fff';ctx.font='16px system-ui';ctx.fillText(DIR_ARROW[selectedDir],leftX+BTN_W/2,L.modeY+BTN_H/2+5);
  }
  for(const cat of CATEGORIES){
    const col=cat.side==='left'?0:1;
    const bx=VIEW_W-10-(2-col)*(BTN_W+GAP);
    const by=L.catStartY-cat.row*(BTN_H+GAP);
    const active=selectedCategory===cat;
    ctx.fillStyle=active?'rgba(255,140,0,.45)':'rgba(25,25,30,.92)';
    ctx.fillRect(bx,by,BTN_W,BTN_H);
    ctx.strokeStyle=active?'#ff8c00':'#444';ctx.lineWidth=1;ctx.strokeRect(bx,by,BTN_W,BTN_H);
    ctx.fillStyle=active?'#ffc86a':'#999';ctx.font='8px system-ui';ctx.textAlign='center';
    ctx.fillText(cat.name.slice(0,8),bx+BTN_W/2,by+BTN_H/2+3);
  }
  if(selectedCategory){
    const blocks=selectedCategory.blocks||[];
    const cols=3;
    const listW=BTN_W*cols+GAP*(cols-1);
    const listX=VIEW_W-10-2*(BTN_W+GAP)-8-listW;
    const rowsVisible=3;
    const listY=L.catStartY-rowsVisible*(BTN_H+GAP);
    const listH=rowsVisible*(BTN_H+GAP)-GAP;
    ctx.fillStyle='rgba(15,15,22,.94)';
    ctx.fillRect(listX-3,listY-3,listW+6,listH+6);
    ctx.strokeStyle='#3a3a48';ctx.strokeRect(listX-3,listY-3,listW+6,listH+6);
    if(!blocks.length){
      ctx.fillStyle='#555';ctx.font='10px system-ui';ctx.textAlign='center';
      ctx.fillText('пусто',listX+listW/2,listY+listH/2);
    }else{
      ctx.save();
      ctx.beginPath();ctx.rect(listX,listY,listW,listH);ctx.clip();
      for(let i=0;i<blocks.length;i++){
        const col=i%cols,row=Math.floor(i/cols);
        const bx=listX+col*(BTN_W+GAP);
        const by=listY+row*(BTN_H+GAP)-blockScroll;
        if(by+BTN_H<listY||by>listY+listH)continue;
        const type=blocks[i];
        const def=BUILDING_DEFS[type];if(!def)continue;
        const sel=selectedBlock===type;
        ctx.fillStyle=sel?'rgba(255,140,0,.35)':'rgba(35,35,42,.95)';
        ctx.fillRect(bx,by,BTN_W,BTN_H);
        ctx.strokeStyle=sel?'#ff8c00':'#333';ctx.lineWidth=sel?2:1;ctx.strokeRect(bx+.5,by+.5,BTN_W-1,BTN_H-1);
        drawBlockModel(type,bx+BTN_W/2,by+BTN_H/2,Math.min(BTN_W,BTN_H)*0.72,0);
      }
      ctx.restore();
      if(blocks.length>cols*rowsVisible){
        ctx.fillStyle='#666';ctx.font='8px system-ui';ctx.textAlign='center';
        ctx.fillText('↕',listX+listW/2,listY+listH+10);
      }
    }
  }
  ctx.fillStyle='rgba(60,30,30,.9)';
  ctx.fillRect(8,VIEW_H-8-BTN_H,BTN_W,BTN_H);
  ctx.strokeStyle='#a55';ctx.strokeRect(8,VIEW_H-8-BTN_H,BTN_W,BTN_H);
  ctx.fillStyle='#faa';ctx.font='16px system-ui';ctx.textAlign='center';
  ctx.fillText('✕',8+BTN_W/2,VIEW_H-8-BTN_H/2+5);
  ctx.textAlign='left';ctx.lineWidth=1;
}

function drawBlockInfo(){
  if(!showBlockInfo||selectedBlock==null)return;
  const def=BUILDING_DEFS[selectedBlock];if(!def)return;
  const w=Math.min(240,VIEW_W-24),pad=8;
  let lines=[def.name,def.desc||'',`Размер: ${def.size}×${def.size}`];
  if(def.itemCap)lines.push(`Склад: ${def.itemCap}`);
  if(def.powerUse)lines.push(`Энергия −${def.powerUse}/с`);
  if(def.powerGen)lines.push(`Ген. +${def.powerGen}/с`);
  if(def.mine)lines.push('Добыча');
  if(def.recipe)lines.push('Крафт');
  if(def.range&&def.damage)lines.push(`Урон ${def.damage} · Дал. ${def.range}`);
  lines=lines.filter(Boolean);
  const h=lines.length*14+pad*2;
  ctx.fillStyle='rgba(12,12,22,.94)';ctx.fillRect(8,36,w,h);
  ctx.strokeStyle='#5a9ae0';ctx.strokeRect(8,36,w,h);
  ctx.font='10px system-ui';
  lines.forEach((ln,i)=>{ctx.fillStyle=i===0?'#ffc86a':'#bbb';ctx.fillText(String(ln).slice(0,40),16,48+i*14)});
}

function drawCoreInv(){
  if(!showCoreInv)return;
  const panelW=Math.min(200,VIEW_W*.4),rowH=18,pad=6,titleH=16;
  const coreItems=RESOURCES.filter(r=>!r.liquid&&(coreInventory[r.id]||0)>0);
  const coreH=titleH+Math.max(1,coreItems.length)*rowH+pad*2;
  const px=8,py=Math.max(40,(VIEW_H-coreH)/2);
  ctx.fillStyle='rgba(12,12,20,.94)';ctx.fillRect(px,py,panelW,coreH);
  ctx.strokeStyle='rgba(100,170,255,.5)';ctx.strokeRect(px,py,panelW,coreH);
  ctx.fillStyle='#6ab0ff';ctx.font='bold 10px system-ui';ctx.fillText('ЯДРО',px+8,py+12);
  if(!coreItems.length){ctx.fillStyle='#555';ctx.font='9px system-ui';ctx.fillText('пусто',px+8,py+titleH+12)}
  else coreItems.forEach((res,i)=>{
    const ry=py+titleH+pad+i*rowH;
    ctx.fillStyle=res.color;ctx.fillRect(px+8,ry+3,8,8);
    ctx.fillStyle='#ccc';ctx.font='9px system-ui';
    ctx.fillText(res.name+' '+Math.floor(coreInventory[res.id]),px+20,ry+11);
  });
}
