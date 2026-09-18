function drawBlockModel(type,cx,cy,s,dir){
  const def=BUILDING_DEFS[type];if(!def)return;
  const c=def.color||'#888';
  const hs=s/2;
  const lw=Math.max(1,s*0.07);
  ctx.save();ctx.translate(cx,cy);
  if(dir!=null&&def.directional)ctx.rotate((dir||0)*Math.PI/2);

  function base(fill){
    ctx.fillStyle=fill||c;
    ctx.fillRect(-hs+1,-hs+1,s-2,s-2);
    ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=lw;
    ctx.strokeRect(-hs+1,-hs+1,s-2,s-2);
  }
  function tri(x1,y1,x2,y2,x3,y3,fill){
    ctx.fillStyle=fill||'#fff';ctx.beginPath();
    ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.closePath();ctx.fill();
  }
  function circ(x,y,r,fill){
    ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  function ring(x,y,r,stroke,w){
    ctx.strokeStyle=stroke;ctx.lineWidth=w||lw;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
  }
  function rect(x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h)}
  function line(x1,y1,x2,y2,stroke,w){
    ctx.strokeStyle=stroke;ctx.lineWidth=w||lw;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }

  if(type===BTYPE.CONVEYOR||type===BTYPE.TITANIUM_CONVEYOR||type===BTYPE.PLASTANIUM_CONVEYOR||type===BTYPE.ARMORED_CONVEYOR){
    base();
    const stripe=type===BTYPE.PLASTANIUM_CONVEYOR?'#6a0':'#222';
    for(let i=-2;i<=2;i++)rect(-hs+2,i*s*0.16-s*0.035,s-4,s*0.07,stripe);
    tri(hs*0.5,0,-hs*0.15,-hs*0.32,-hs*0.15,hs*0.32,'#fff');
    if(type===BTYPE.ARMORED_CONVEYOR){ctx.strokeStyle='#ccc';ctx.lineWidth=lw;ctx.strokeRect(-hs+3,-hs+3,s-6,s-6)}
  }
  else if(type===BTYPE.JUNCTION){
    base('#555');
    line(-hs*0.5,0,hs*0.5,0,'#aaa',lw*1.5);
    line(0,-hs*0.5,0,hs*0.5,'#aaa',lw*1.5);
    circ(0,0,hs*0.18,'#888');
  }
  else if(type===BTYPE.BRIDGE||type===BTYPE.PHASE_BRIDGE){
    base(type===BTYPE.PHASE_BRIDGE?'#8a5ccc':'#a08040');
    rect(-hs*0.7,-hs*0.2,s*0.55,s*0.4,'rgba(0,0,0,.35)');
    tri(hs*0.55,0,hs*0.05,-hs*0.28,hs*0.05,hs*0.28,'#ffe');
    if(type===BTYPE.PHASE_BRIDGE){ring(0,0,hs*0.55,'#e0a0ff',lw)}
  }
  else if(type===BTYPE.ROUTER||type===BTYPE.DISTRIBUTOR){
    base('#cc8844');
    circ(0,0,hs*0.28,'#e0a060');
    for(let a=0;a<4;a++){ctx.save();ctx.rotate(a*Math.PI/2);rect(hs*0.2,-s*0.07,hs*0.5,s*0.14,'#e0a060');ctx.restore()}
    if(type===BTYPE.DISTRIBUTOR){ring(0,0,hs*0.65,'#fff',lw)}
  }
  else if(type===BTYPE.SORTER||type===BTYPE.INV_SORTER){
    base(type===BTYPE.SORTER?'#44aa88':'#aa4488');
    ctx.fillStyle='#fff';ctx.beginPath();
    ctx.moveTo(-hs*0.4,-hs*0.4);ctx.lineTo(hs*0.4,-hs*0.4);ctx.lineTo(hs*0.15,hs*0.15);
    ctx.lineTo(hs*0.15,hs*0.4);ctx.lineTo(-hs*0.15,hs*0.4);ctx.lineTo(-hs*0.15,hs*0.15);
    ctx.closePath();ctx.fill();
    if(type===BTYPE.INV_SORTER){line(-hs*0.3,0,hs*0.3,0,'#f88',lw*1.5)}
  }
  else if(type===BTYPE.GATE||type===BTYPE.INV_GATE){
    base(type===BTYPE.GATE?'#888844':'#884488');
    rect(-hs*0.55,-hs*0.15,s*1.1-2,s*0.3,'#222');
    circ(0,0,hs*0.2,type===BTYPE.GATE?'#cc4':'#c4c');
  }
  else if(type===BTYPE.UNLOADER){
    base('#6ab0ff');
    rect(-hs*0.45,-hs*0.45,s*0.55,s*0.9,'#4a90d0');
    tri(hs*0.55,0,hs*0.05,-hs*0.3,hs*0.05,hs*0.3,'#fff');
  }
  else if(type===BTYPE.MASS_DRIVER){
    base('#6a5a8a');
    circ(0,0,hs*0.35,'#9a8aba');
    rect(0,-s*0.12,hs*0.8,s*0.24,'#ccc');
    circ(hs*0.55,0,hs*0.12,'#fff');
  }
  else if(type===BTYPE.CONTAINER||type===BTYPE.VAULT){
    base(type===BTYPE.VAULT?'#5a4a3a':'#7a6a5a');
    rect(-hs*0.55,-hs*0.55,s*0.7,s*0.7,'rgba(0,0,0,.35)');
    rect(-hs*0.6,-hs*0.55,s*0.8,s*0.15,'#c4a070');
    circ(0,hs*0.1,hs*0.12,'#da8');
  }
  else if(type===BTYPE.MECH_DRILL||type===BTYPE.PNEU_DRILL||type===BTYPE.LASER_DRILL||type===BTYPE.AIRBLAST_DRILL){
    base();
    circ(0,0,hs*0.55,'rgba(0,0,0,.35)');
    ring(0,0,hs*0.4,'#ffc050',lw*1.2);
    if(type===BTYPE.LASER_DRILL){
      line(0,0,0,-hs*0.55,'#6cf',lw*1.5);circ(0,-hs*0.55,hs*0.1,'#9df');
    }else if(type===BTYPE.AIRBLAST_DRILL){
      for(let a=0;a<3;a++){ctx.save();ctx.rotate(a*Math.PI*2/3);tri(0,0,-hs*0.2,-hs*0.5,hs*0.2,-hs*0.5,'#ffc050');ctx.restore()}
    }else{
      line(-hs*0.35,0,hs*0.35,0,'#ffc050',lw);line(0,-hs*0.35,0,hs*0.35,'#ffc050',lw);
      if(type===BTYPE.PNEU_DRILL)ring(0,0,hs*0.25,'#8cf',lw);
    }
  }
  else if(type===BTYPE.CONDUIT||type===BTYPE.PULSE_CONDUIT||type===BTYPE.PLATED_CONDUIT){
    base(type===BTYPE.PLATED_CONDUIT?'#5a80a0':type===BTYPE.PULSE_CONDUIT?'#6ab0ff':'#4a90d0');
    rect(-hs*0.7,-hs*0.22,s*1.4-2,s*0.44,'#2a6080');
    circ(-hs*0.55,0,hs*0.22,'#3a80a0');circ(hs*0.55,0,hs*0.22,'#3a80a0');
  }
  else if(type===BTYPE.LIQUID_ROUTER||type===BTYPE.LIQUID_JUNCTION){
    base('#3a70b0');circ(0,0,hs*0.3,'#5af');
    for(let a=0;a<4;a++){ctx.save();ctx.rotate(a*Math.PI/2);rect(hs*0.2,-s*0.08,hs*0.45,s*0.16,'#5af');ctx.restore()}
  }
  else if(type===BTYPE.LIQUID_BRIDGE||type===BTYPE.PHASE_CONDUIT){
    base(type===BTYPE.PHASE_CONDUIT?'#a070ff':'#5aa0c0');
    rect(-hs*0.7,-hs*0.18,s*0.9,s*0.36,'#2a5080');
    tri(hs*0.5,0,0,-hs*0.25,0,hs*0.25,'#8cf');
  }
  else if(type===BTYPE.TANK||type===BTYPE.LARGE_TANK){
    base('#2a5070');
    ctx.fillStyle='#4a90c0';ctx.beginPath();ctx.ellipse(0,hs*0.25,hs*0.55,hs*0.25,0,0,Math.PI*2);ctx.fill();
    rect(-hs*0.55,-hs*0.35,s*0.7,s*0.6,'#3a70a0');
    ctx.fillStyle='#6ab0e0';ctx.beginPath();ctx.ellipse(0,-hs*0.35,hs*0.55,hs*0.22,0,0,Math.PI*2);ctx.fill();
  }
  else if(type===BTYPE.MECH_PUMP||type===BTYPE.ROTARY_PUMP||type===BTYPE.THERMAL_PUMP){
    base('#4a80b0');circ(0,hs*0.1,hs*0.4,'#2a5080');
    rect(-s*0.08,-hs*0.7,s*0.16,hs*0.55,'#8df');circ(0,-hs*0.65,hs*0.14,'#aef');
    if(type===BTYPE.ROTARY_PUMP||type===BTYPE.THERMAL_PUMP)ring(0,hs*0.1,hs*0.25,'#fff',lw);
  }
  else if(type===BTYPE.WATER_EXTRACTOR){
    base('#40a0c0');circ(0,0,hs*0.45,'#1a4060');ring(0,0,hs*0.45,'#6cf',lw);
    rect(-s*0.06,-hs*0.7,s*0.12,hs*0.4,'#8df');
  }
  else if(type===BTYPE.OIL_EXTRACTOR){
    base('#2a1a0a');
    line(-hs*0.3,hs*0.4,0,-hs*0.6,'#c80',lw*1.5);line(hs*0.3,hs*0.4,0,-hs*0.6,'#c80',lw*1.5);
    line(-hs*0.3,hs*0.4,hs*0.3,hs*0.4,'#c80',lw);circ(0,hs*0.15,hs*0.2,'#543');
  }
  else if(type===BTYPE.CULTIVATOR){
    base('#50a040');
    for(let i=-1;i<=1;i++){line(i*hs*0.25,hs*0.3,i*hs*0.25,-hs*0.3,'#8d8',lw);circ(i*hs*0.25,-hs*0.35,hs*0.12,'#6c6')}
  }
  else if(type===BTYPE.POWER_NODE||type===BTYPE.LARGE_POWER_NODE||type===BTYPE.SURGE_TOWER){
    base(type===BTYPE.SURGE_TOWER?'#f3e03b':'#e0c040');circ(0,0,hs*0.25,'#ffe060');
    for(let a=0;a<4;a++){ctx.save();ctx.rotate(a*Math.PI/2+Math.PI/4);line(hs*0.25,0,hs*0.7,0,'#ffe060',lw);ctx.restore()}
    if(type===BTYPE.SURGE_TOWER)ring(0,0,hs*0.55,'#fff',lw);
  }
  else if(type===BTYPE.BATTERY||type===BTYPE.LARGE_BATTERY){
    base('#50b050');rect(-hs*0.4,-hs*0.5,s*0.5,s*0.85,'#2a5a2a');
    rect(-hs*0.15,-hs*0.65,s*0.12,s*0.15,'#ccc');rect(hs*0.05,-hs*0.65,s*0.12,s*0.15,'#ccc');
    rect(-hs*0.3,-hs*0.2,s*0.35,s*0.1,'#6f6');rect(-hs*0.3,0,s*0.35,s*0.1,'#6f6');rect(-hs*0.3,hs*0.2,s*0.25,s*0.1,'#6f6');
  }
  else if(type===BTYPE.COMBUSTION||type===BTYPE.THERMAL_GEN||type===BTYPE.STEAM_GEN||type===BTYPE.DIFF_GEN||type===BTYPE.RTG){
    base();
    if(type===BTYPE.COMBUSTION){
      rect(-hs*0.4,-hs*0.3,s*0.55,s*0.6,'#543');circ(hs*0.35,0,hs*0.2,'#c44');rect(hs*0.25,-hs*0.5,s*0.12,hs*0.35,'#888');
    }else if(type===BTYPE.THERMAL_GEN){
      circ(0,0,hs*0.45,'#c44');
      for(let a=0;a<6;a++){ctx.save();ctx.rotate(a*Math.PI/3);rect(hs*0.2,-s*0.05,hs*0.35,s*0.1,'#fa0');ctx.restore()}
    }else if(type===BTYPE.STEAM_GEN){
      rect(-hs*0.5,-hs*0.2,s*0.65,s*0.5,'#89a');rect(hs*0.15,-hs*0.6,s*0.2,hs*0.55,'#678');circ(hs*0.25,-hs*0.6,hs*0.12,'#abc');
    }else if(type===BTYPE.DIFF_GEN){
      circ(0,0,hs*0.4,'#4ac');circ(-hs*0.2,0,hs*0.2,'#8ef');circ(hs*0.2,0,hs*0.2,'#f84');
    }else{
      circ(0,0,hs*0.4,'#a6c');
      for(let a=0;a<3;a++){ctx.save();ctx.rotate(a*Math.PI*2/3);tri(0,0,-hs*0.15,-hs*0.4,hs*0.15,-hs*0.4,'#fcf');ctx.restore()}
      circ(0,0,hs*0.12,'#222');
    }
  }
  else if(type===BTYPE.SOLAR||type===BTYPE.LARGE_SOLAR){
    base('#3050a0');rect(-hs*0.55,-hs*0.55,s*0.7,s*0.7,'#1a3060');
    ctx.strokeStyle='#6af';ctx.lineWidth=lw*0.7;
    for(let i=-1;i<=1;i++){
      ctx.beginPath();ctx.moveTo(i*hs*0.25,-hs*0.5);ctx.lineTo(i*hs*0.25,hs*0.5);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-hs*0.5,i*hs*0.25);ctx.lineTo(hs*0.5,i*hs*0.25);ctx.stroke();
    }
  }
  else if(type===BTYPE.THORIUM_REACTOR||type===BTYPE.IMPACT_REACTOR){
    base(type===BTYPE.IMPACT_REACTOR?'#ff60a0':'#e090c0');
    circ(0,0,hs*0.45,'#402040');ring(0,0,hs*0.45,'#f9a',lw*1.3);ring(0,0,hs*0.25,'#f9a',lw);
    if(type===BTYPE.IMPACT_REACTOR){for(let a=0;a<4;a++){ctx.save();ctx.rotate(a*Math.PI/2);line(hs*0.3,0,hs*0.65,0,'#fff',lw);ctx.restore()}}
  }
  else if(type===BTYPE.GRAPHITE_PRESS||type===BTYPE.MULTI_PRESS){
    base('#606060');
    rect(-hs*0.5,-hs*0.55,s*0.65,s*0.2,'#aaa');rect(-hs*0.5,hs*0.2,s*0.65,s*0.2,'#aaa');rect(-hs*0.15,-hs*0.4,s*0.2,s*0.65,'#888');
  }
  else if(type===BTYPE.SILICON_SMELTER||type===BTYPE.SILICON_CRUCIBLE||type===BTYPE.KILN||type===BTYPE.SURGE_SMELTER||type===BTYPE.MELTER){
    base();
    rect(-hs*0.45,-hs*0.2,s*0.6,s*0.55,'#432');
    circ(0,hs*0.1,hs*0.2,type===BTYPE.SURGE_SMELTER?'#fe5':type===BTYPE.MELTER?'#f60':'#fa0');
    rect(hs*0.15,-hs*0.6,s*0.18,hs*0.5,'#654');
  }
  else if(type===BTYPE.PLASTANIUM_COMPRESSOR){
    base('#80c060');rect(-hs*0.5,-hs*0.4,s*0.65,s*0.7,'#5a8a40');
    circ(-hs*0.15,0,hs*0.2,'#8c8');circ(hs*0.2,0,hs*0.2,'#8c8');
  }
  else if(type===BTYPE.PHASE_WEAVER){
    base('#b080e0');ctx.strokeStyle='#e0c0ff';ctx.lineWidth=lw;
    ctx.beginPath();ctx.moveTo(0,-hs*0.5);ctx.lineTo(hs*0.5,0);ctx.lineTo(0,hs*0.5);ctx.lineTo(-hs*0.5,0);ctx.closePath();ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-hs*0.25);ctx.lineTo(hs*0.25,0);ctx.lineTo(0,hs*0.25);ctx.lineTo(-hs*0.25,0);ctx.closePath();ctx.stroke();
  }
  else if(type===BTYPE.CRYOFLUID_MIXER||type===BTYPE.PYRATITE_MIXER||type===BTYPE.BLAST_MIXER){
    base(type===BTYPE.CRYOFLUID_MIXER?'#60d0e0':type===BTYPE.PYRATITE_MIXER?'#e06040':'#e04060');
    circ(0,0,hs*0.45,'rgba(0,0,0,.3)');
    for(let a=0;a<3;a++){ctx.save();ctx.rotate(a*Math.PI*2/3);rect(0,-s*0.08,hs*0.4,s*0.16,'#fff');ctx.restore()}
    circ(0,0,hs*0.12,'#ccc');
  }
  else if(type===BTYPE.SEPARATOR||type===BTYPE.DISASSEMBLER){
    base('#a08060');
    tri(-hs*0.1,-hs*0.15,-hs*0.5,-hs*0.4,-hs*0.5,hs*0.1,'#fc8');
    tri(hs*0.1,-hs*0.15,hs*0.5,-hs*0.4,hs*0.5,hs*0.1,'#8cf');
    rect(-hs*0.15,hs*0.1,s*0.3,hs*0.4,'#864');
  }
  else if(type===BTYPE.SPORE_PRESS){
    base('#60a040');circ(0,0,hs*0.4,'#4a8a30');
    for(let a=0;a<5;a++){const ang=a*Math.PI*2/5;circ(Math.cos(ang)*hs*0.25,Math.sin(ang)*hs*0.25,hs*0.1,'#8f8')}
  }
  else if(type===BTYPE.PULVERIZER){
    base('#a09070');circ(0,0,hs*0.45,'#765');
    for(let a=0;a<8;a++){ctx.save();ctx.rotate(a*Math.PI/4);tri(hs*0.3,0,hs*0.55,-hs*0.12,hs*0.55,hs*0.12,'#ccc');ctx.restore()}
  }
  else if(type===BTYPE.COAL_CENTRIFUGE){
    base('#505050');ring(0,0,hs*0.45,'#aaa',lw*1.2);circ(0,0,hs*0.15,'#333');
    for(let a=0;a<4;a++){ctx.save();ctx.rotate(a*Math.PI/2);rect(hs*0.15,-s*0.06,hs*0.3,s*0.12,'#888');ctx.restore()}
  }
  else if(type===BTYPE.INCINERATOR){
    base('#404040');rect(-hs*0.4,-hs*0.3,s*0.55,s*0.55,'#222');
    tri(0,-hs*0.1,-hs*0.2,hs*0.3,hs*0.2,hs*0.3,'#f80');tri(0,-hs*0.3,-hs*0.12,hs*0.1,hs*0.12,hs*0.1,'#ff0');
  }
  else if(def.category==='walls'){
    base();
    const bs=s/3;ctx.fillStyle='rgba(0,0,0,.3)';
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)if((row+col)%2)ctx.fillRect(-hs+col*bs+1,-hs+row*bs+1,bs-1,bs-1);
    if(type===BTYPE.DOOR){rect(-hs*0.15,-hs*0.55,s*0.3,s*0.9,'#666');circ(hs*0.05,0,hs*0.08,'#ccc')}
    if(type===BTYPE.PHASE_WALL||type===BTYPE.PHASE_WALL_L)ring(0,0,hs*0.4,'#e0a0ff',lw);
    if(type===BTYPE.SURGE_WALL||type===BTYPE.SURGE_WALL_L){line(-hs*0.3,-hs*0.3,hs*0.3,hs*0.3,'#ffe060',lw);line(hs*0.3,-hs*0.3,-hs*0.3,hs*0.3,'#ffe060',lw)}
  }
  else if(def.category==='turret'){
    base();circ(0,hs*0.1,hs*0.4,'rgba(0,0,0,.4)');circ(0,hs*0.1,hs*0.25,c);
    if(type===BTYPE.SCORCH||type===BTYPE.MELTDOWN){
      rect(-s*0.12,-hs*0.7,s*0.24,hs*0.75,'#f84');tri(0,-hs*0.75,-hs*0.2,-hs*0.45,hs*0.2,-hs*0.45,'#ff0');
    }else if(type===BTYPE.ARC||type===BTYPE.LANCER||type===BTYPE.PARALLAX||type===BTYPE.SEGMENT){
      rect(-s*0.06,-hs*0.75,s*0.12,hs*0.8,'#8ef');circ(0,-hs*0.7,hs*0.12,'#cff');
    }else if(type===BTYPE.WAVE||type===BTYPE.TSUNAMI){
      rect(-s*0.1,-hs*0.65,s*0.2,hs*0.7,'#4af');
      ctx.strokeStyle='#8cf';ctx.lineWidth=lw;ctx.beginPath();ctx.arc(0,-hs*0.5,hs*0.3,Math.PI*0.2,Math.PI*0.8);ctx.stroke();
    }else if(type===BTYPE.HAIL||type===BTYPE.RIPPLE||type===BTYPE.FORESHADOW){
      rect(-s*0.07,-hs*0.8,s*0.14,hs*0.9,'#aaa');rect(-s*0.12,-hs*0.3,s*0.24,s*0.2,'#888');
    }else if(type===BTYPE.SWARMER||type===BTYPE.CYCLONE){
      for(let i=-1;i<=1;i++)rect(i*s*0.18-s*0.06,-hs*0.65,s*0.12,hs*0.7,'#d84');
    }else if(type===BTYPE.SCATTER){
      rect(-hs*0.28,-hs*0.65,s*0.12,hs*0.7,'#aaa');rect(hs*0.16,-hs*0.65,s*0.12,hs*0.7,'#aaa');
    }else if(type===BTYPE.SPECTRE){
      rect(-s*0.1,-hs*0.75,s*0.2,hs*0.85,'#c44');rect(-s*0.18,-hs*0.2,s*0.36,s*0.25,'#a33');
    }else if(type===BTYPE.FUSE){
      rect(-s*0.14,-hs*0.55,s*0.28,hs*0.65,'#ca6');circ(0,-hs*0.55,hs*0.18,'#fc8');
    }else{
      rect(-s*0.08,-hs*0.7,s*0.16,hs*0.75,'#ccc');
      if(type===BTYPE.DUO||type===BTYPE.SALVO){
        rect(-hs*0.25,-hs*0.55,s*0.12,hs*0.55,'#bbb');rect(hs*0.13,-hs*0.55,s*0.12,hs*0.55,'#bbb');
      }
    }
  }
  else if(def.category==='units'){
    base();
    if(def.reconTier){
      ctx.strokeStyle='#8f8';ctx.lineWidth=lw*1.2;ctx.strokeRect(-hs*0.55,-hs*0.55,s*0.7,s*0.7);
      tri(0,-hs*0.35,-hs*0.25,hs*0.1,hs*0.25,hs*0.1,'#8f8');rect(-hs*0.1,hs*0.05,s*0.2,hs*0.35,'#8f8');
    }else if(type===BTYPE.REPAIR_POINT||type===BTYPE.REPAIR_TURRET){
      circ(0,0,hs*0.35,'#2a6a4a');rect(-hs*0.1,-hs*0.35,s*0.2,s*0.7,'#6f6');rect(-hs*0.35,-hs*0.1,s*0.7,s*0.2,'#6f6');
    }else if(type===BTYPE.AIR_FACTORY){
      tri(0,0,-hs*0.55,-hs*0.35,hs*0.55,-hs*0.35,'#8ab');tri(0,hs*0.15,-hs*0.25,hs*0.5,hs*0.25,hs*0.5,'#8ab');circ(0,0,hs*0.15,'#fff');
    }else if(type===BTYPE.NAVAL_FACTORY){
      ctx.fillStyle='#5af';ctx.beginPath();
      ctx.moveTo(-hs*0.5,hs*0.2);ctx.lineTo(-hs*0.3,-hs*0.3);ctx.lineTo(hs*0.5,-hs*0.1);
      ctx.lineTo(hs*0.4,hs*0.35);ctx.closePath();ctx.fill();
    }else{
      tri(hs*0.45,0,-hs*0.35,-hs*0.35,-hs*0.35,hs*0.35,'#eee');
      rect(-hs*0.5,hs*0.15,s*0.25,s*0.25,'#ccc');rect(-hs*0.5,-hs*0.4,s*0.25,s*0.25,'#ccc');
    }
  }
  else if(type===BTYPE.MENDER||type===BTYPE.MEND_PROJECTOR){
    base('#50c070');
    rect(-hs*0.12,-hs*0.4,s*0.24,s*0.8,'#8f8');rect(-hs*0.4,-hs*0.12,s*0.8,s*0.24,'#8f8');
    if(type===BTYPE.MEND_PROJECTOR)ring(0,0,hs*0.55,'#8f8',lw);
  }
  else if(type===BTYPE.OVERDRIVE||type===BTYPE.OVERDRIVE_DOME){
    base('#e0c040');
    tri(hs*0.5,0,-hs*0.2,-hs*0.35,-hs*0.2,hs*0.35,'#ffe060');
    tri(hs*0.15,0,-hs*0.45,-hs*0.25,-hs*0.45,hs*0.25,'#fc6');
    if(type===BTYPE.OVERDRIVE_DOME)ring(0,0,hs*0.6,'#ffe060',lw);
  }
  else if(type===BTYPE.FORCE_PROJECTOR){
    base('#60a0ff');ring(0,0,hs*0.5,'#8cf',lw*1.5);ring(0,0,hs*0.3,'#8cf',lw);circ(0,0,hs*0.1,'#cef');
  }
  else if(type===BTYPE.SHOCK_MINE){
    base('#a04040');circ(0,0,hs*0.4,'#602020');
    for(let a=0;a<6;a++){ctx.save();ctx.rotate(a*Math.PI/3);tri(0,-hs*0.15,hs*0.12,-hs*0.55,-hs*0.12,-hs*0.55,'#f66');ctx.restore()}
    circ(0,0,hs*0.12,'#f88');
  }
  else if(type===BTYPE.ILLUMINATOR){
    base('#ffffa0');rect(-hs*0.12,hs*0.05,s*0.24,hs*0.45,'#888');
    circ(0,-hs*0.15,hs*0.35,'#ffc');circ(0,-hs*0.15,hs*0.2,'#fff');
  }
  else if(type===BTYPE.SWITCH){
    base('#808080');rect(-hs*0.4,-hs*0.25,s*0.55,s*0.5,'#444');circ(hs*0.1,0,hs*0.18,'#6f6');
  }
  else if(type===BTYPE.MESSAGE){
    base('#606080');
    ctx.fillStyle='#aaf';ctx.beginPath();
    ctx.moveTo(-hs*0.45,-hs*0.35);ctx.lineTo(hs*0.45,-hs*0.35);ctx.lineTo(hs*0.45,hs*0.2);
    ctx.lineTo(hs*0.1,hs*0.2);ctx.lineTo(0,hs*0.45);ctx.lineTo(-hs*0.1,hs*0.2);
    ctx.lineTo(-hs*0.45,hs*0.2);ctx.closePath();ctx.fill();
    line(-hs*0.25,-hs*0.15,hs*0.25,-hs*0.15,'#446',lw);line(-hs*0.25,0,hs*0.15,0,'#446',lw);
  }
  else if(type===BTYPE.LOGIC_PROCESSOR){
    base('#5060a0');rect(-hs*0.5,-hs*0.5,s*0.65,s*0.65,'#2a2a50');
    ctx.fillStyle='#6af';
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)ctx.fillRect(-hs*0.35+j*s*0.22,-hs*0.35+i*s*0.22,s*0.12,s*0.12);
  }
  else if(def.category==='factory'){
    base();circ(0,0,hs*0.45,'rgba(0,0,0,.3)');
    for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);rect(hs*0.2,-s*0.06,hs*0.3,s*0.12,'rgba(255,255,255,.4)');ctx.restore()}
    circ(0,0,hs*0.15,'#ccc');
  }
  else{
    base();circ(0,0,hs*0.3,'rgba(255,255,255,.25)');
  }

  if(def.size>1&&s<30){
    ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(hs-13,-hs+1,12,9);
    ctx.fillStyle='#ffe8a0';ctx.font='bold 7px system-ui';ctx.textAlign='center';
    ctx.fillText(def.size+'×',hs-7,-hs+8);
  }
  ctx.restore();
}
