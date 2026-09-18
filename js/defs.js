const MAP_SIZE=160,TILE=16,CORE_RANGE=20,PLAYER_MAX=30;
const BLOCK={WALL:0,DIRT:1,FERTILE:2,WATER:3,CORE:4,HOT:5};
const COLORS={[BLOCK.WALL]:'#555',[BLOCK.DIRT]:'#8B5A2B',[BLOCK.FERTILE]:'#5C4033',[BLOCK.WATER]:'#1E90FF',[BLOCK.CORE]:'#2a2a3a',[BLOCK.HOT]:'#c44a1a'};
const ORE={NONE:0,COPPER:1,LEAD:2,COAL:3,TITANIUM:4,THORIUM:5,METALOM:6};
const ORE_COLORS={[ORE.COPPER]:'#d99d73',[ORE.LEAD]:'#8c7fa9',[ORE.COAL]:'#1a1a1a',[ORE.TITANIUM]:'#8da1b0',[ORE.THORIUM]:'#f9a3c7',[ORE.METALOM]:'#6e6e6e'};
const ORE_TO_ID={[ORE.COPPER]:'copper',[ORE.LEAD]:'lead',[ORE.COAL]:'coal',[ORE.TITANIUM]:'titanium',[ORE.THORIUM]:'thorium',[ORE.METALOM]:'metalom'};
const PLAYER_FORBIDDEN=new Set([ORE.TITANIUM,ORE.THORIUM]);
const DIR={RIGHT:0,DOWN:1,LEFT:2,UP:3};
const DIR_DX=[1,0,-1,0],DIR_DY=[0,1,0,-1];
const DIR_ARROW=['→','↓','←','↑'];

const RESOURCES=[
  {id:'copper',name:'Медь',color:'#d99d73',icon:'ore'},
  {id:'lead',name:'Свинец',color:'#8c7fa9',icon:'ore'},
  {id:'coal',name:'Уголь',color:'#272727',icon:'ore'},
  {id:'sand',name:'Песок',color:'#f7cba0',icon:'sand'},
  {id:'titanium',name:'Титан',color:'#8da1b0',icon:'ore'},
  {id:'thorium',name:'Торий',color:'#f9a3c7',icon:'ore'},
  {id:'metalom',name:'Металлом',color:'#6e6e6e',icon:'ingot'},
  {id:'graphite',name:'Графит',color:'#b0b0b0',icon:'ingot'},
  {id:'metaglass',name:'Метастекло',color:'#e8f4f8',icon:'glass'},
  {id:'silicon',name:'Кремний',color:'#d4d4c8',icon:'ingot'},
  {id:'phase',name:'Фазовая ткань',color:'#c77dff',icon:'fabric'},
  {id:'surge',name:'Кинет. сплав',color:'#f3e03b',icon:'ingot'},
  {id:'plastanium',name:'Пластан',color:'#9eff7a',icon:'ingot'},
  {id:'spore',name:'Споровый стручок',color:'#6bcf5f',icon:'spore'},
  {id:'blast',name:'Взрывная смесь',color:'#ff6b35',icon:'powder'},
  {id:'pyratite',name:'Пиротит',color:'#ff3c00',icon:'powder'},
  {id:'water',name:'Вода',color:'#4da6ff',icon:'liquid',liquid:true},
  {id:'slag',name:'Шлак',color:'#ff6a00',icon:'liquid',liquid:true},
  {id:'oil',name:'Нефть',color:'#2a1a0a',icon:'liquid',liquid:true},
  {id:'cryo',name:'Криогенная жидкость',color:'#6ef0ff',icon:'liquid',liquid:true}
];

let _id=0;
const BTYPE={
  CONVEYOR:_id++,TITANIUM_CONVEYOR:_id++,PLASTANIUM_CONVEYOR:_id++,JUNCTION:_id++,BRIDGE:_id++,PHASE_BRIDGE:_id++,
  ROUTER:_id++,SORTER:_id++,INV_SORTER:_id++,GATE:_id++,INV_GATE:_id++,DISTRIBUTOR:_id++,UNLOADER:_id++,
  MECH_DRILL:_id++,PNEU_DRILL:_id++,LASER_DRILL:_id++,AIRBLAST_DRILL:_id++,
  CONDUIT:_id++,PULSE_CONDUIT:_id++,LIQUID_ROUTER:_id++,LIQUID_JUNCTION:_id++,LIQUID_BRIDGE:_id++,PHASE_CONDUIT:_id++,
  TANK:_id++,LARGE_TANK:_id++,MECH_PUMP:_id++,ROTARY_PUMP:_id++,THERMAL_PUMP:_id++,WATER_EXTRACTOR:_id++,OIL_EXTRACTOR:_id++,CULTIVATOR:_id++,
  POWER_NODE:_id++,LARGE_POWER_NODE:_id++,SURGE_TOWER:_id++,BATTERY:_id++,LARGE_BATTERY:_id++,
  COMBUSTION:_id++,THERMAL_GEN:_id++,STEAM_GEN:_id++,DIFF_GEN:_id++,RTG:_id++,SOLAR:_id++,LARGE_SOLAR:_id++,THORIUM_REACTOR:_id++,IMPACT_REACTOR:_id++,
  GRAPHITE_PRESS:_id++,MULTI_PRESS:_id++,SILICON_SMELTER:_id++,SILICON_CRUCIBLE:_id++,KILN:_id++,PLASTANIUM_COMPRESSOR:_id++,PHASE_WEAVER:_id++,SURGE_SMELTER:_id++,
  CRYOFLUID_MIXER:_id++,PYRATITE_MIXER:_id++,BLAST_MIXER:_id++,MELTER:_id++,SEPARATOR:_id++,DISASSEMBLER:_id++,SPORE_PRESS:_id++,PULVERIZER:_id++,COAL_CENTRIFUGE:_id++,INCINERATOR:_id++
};

function def(o){return Object.assign({size:1,itemCap:10,liqCap:60,powerUse:0,powerGen:0,directional:false,category:'util',desc:''},o)}

const BUILDING_DEFS={
  [BTYPE.CONVEYOR]:def({name:'Конвейер',size:1,color:'#8a8a8a',speed:.08,directional:true,category:'transport',desc:'Базовый конвейер'}),
  [BTYPE.TITANIUM_CONVEYOR]:def({name:'Титан. конв.',size:1,color:'#8da1b0',speed:.16,directional:true,category:'transport',desc:'Быстрый конвейер'}),
  [BTYPE.PLASTANIUM_CONVEYOR]:def({name:'Пластан. конв.',size:1,color:'#9eff7a',speed:.06,directional:true,category:'transport',desc:'Пакетный конвейер'}),
  [BTYPE.JUNCTION]:def({name:'Перекресток',size:1,color:'#666',category:'transport',desc:'Пересечение'}),
  [BTYPE.BRIDGE]:def({name:'Мост',size:1,color:'#a08040',range:3,directional:true,category:'transport',desc:'Мост 0-3'}),
  [BTYPE.PHASE_BRIDGE]:def({name:'Фаз. мост',size:1,color:'#c77dff',range:15,directional:true,category:'transport',desc:'Мост до 15'}),
  [BTYPE.ROUTER]:def({name:'Маршрутизатор',size:1,color:'#cc8844',category:'transport',desc:'Равномерно раздаёт'}),
  [BTYPE.SORTER]:def({name:'Сортировщик',size:1,color:'#44aa88',directional:true,category:'transport',desc:'Выбранный вперёд'}),
  [BTYPE.INV_SORTER]:def({name:'Инв. сортир.',size:1,color:'#aa4488',directional:true,category:'transport',desc:'Выбранный вбок'}),
  [BTYPE.GATE]:def({name:'Затвор',size:1,color:'#888844',directional:true,category:'transport',desc:'Overflow'}),
  [BTYPE.INV_GATE]:def({name:'Инв. затвор',size:1,color:'#884488',directional:true,category:'transport',desc:'Inverted overflow'}),
  [BTYPE.DISTRIBUTOR]:def({name:'Распределитель',size:2,color:'#cc8844',category:'transport',desc:'Маршрутизатор 2x2'}),
  [BTYPE.UNLOADER]:def({name:'Разгрузчик',size:1,color:'#6ab0ff',directional:true,category:'transport',desc:'Выгрузка из блока/ядра'}),
  [BTYPE.MECH_DRILL]:def({name:'Мех. бур',size:2,color:'#8a7050',itemCap:10,liqCap:30,category:'drill',mine:{sand:.4,copper:.36,lead:.36,coal:.34},boostWater:3,boostMul:2.56,desc:'2x2. Вода x2.56'}),
  [BTYPE.PNEU_DRILL]:def({name:'Пневм. бур',size:2,color:'#6a8a9a',itemCap:10,liqCap:35,category:'drill',mine:{sand:.6,copper:.53,lead:.53,coal:.48,titanium:.43},boostWater:3,boostMul:2.56,desc:'Добывает титан'}),
  [BTYPE.LASER_DRILL]:def({name:'Лазер. бур',size:3,color:'#c080ff',itemCap:10,liqCap:48,powerUse:66,category:'drill',mine:{sand:1.92,copper:1.63,lead:1.63,coal:1.42,titanium:1.25,thorium:1.12},boostWater:4.8,boostMul:2.56,desc:'3x3. 66 э/с'}),
  [BTYPE.AIRBLAST_DRILL]:def({name:'Воздуш. бур',size:4,color:'#90c0e0',itemCap:20,liqCap:60,powerUse:180,category:'drill',mine:{sand:3.42,copper:2.9,lead:2.9,coal:2.52,titanium:2.23,thorium:2.0},boostWater:6,boostMul:3.24,desc:'4x4. 180 э/с'}),
  [BTYPE.CONDUIT]:def({name:'Трубопровод',size:1,color:'#4a90d0',directional:true,category:'liquid',desc:'Труба'}),
  [BTYPE.PULSE_CONDUIT]:def({name:'Имп. трубопровод',size:1,color:'#6ab0ff',directional:true,category:'liquid',desc:'Быстрая труба'}),
  [BTYPE.LIQUID_ROUTER]:def({name:'Жидк. маршрутиз.',size:1,color:'#3a70b0',category:'liquid',desc:'Маршрутизатор жидкостей'}),
  [BTYPE.LIQUID_JUNCTION]:def({name:'Жидк. перекрёсток',size:1,color:'#2a5080',category:'liquid',desc:'Перекрёсток'}),
  [BTYPE.LIQUID_BRIDGE]:def({name:'Жидк. мост',size:1,color:'#5aa0c0',range:3,directional:true,category:'liquid',desc:'Мост жидкостей'}),
  [BTYPE.PHASE_CONDUIT]:def({name:'Фаз. трубопровод',size:1,color:'#a070ff',range:15,directional:true,category:'liquid',desc:'Фазовый мост'}),
  [BTYPE.TANK]:def({name:'Цистерна',size:2,color:'#3a6080',liqCap:700,itemCap:0,category:'liquid',desc:'700 жидкости'}),
  [BTYPE.LARGE_TANK]:def({name:'Большая цистерна',size:3,color:'#2a5070',liqCap:1800,itemCap:0,category:'liquid',desc:'1800 жидкости'}),
  [BTYPE.MECH_PUMP]:def({name:'Мех. помпа',size:1,color:'#4a80b0',liqCap:20,powerUse:0,pumpRate:7,category:'liquid',desc:'7 воды/с'}),
  [BTYPE.ROTARY_PUMP]:def({name:'Роторная помпа',size:2,color:'#5a90c0',liqCap:80,powerUse:18,pumpRate:48,category:'liquid',desc:'48 воды/с'}),
  [BTYPE.THERMAL_PUMP]:def({name:'Терм. помпа',size:3,color:'#6aa0d0',liqCap:200,powerUse:78,pumpRate:118,category:'liquid',desc:'118 воды/с'}),
  [BTYPE.WATER_EXTRACTOR]:def({name:'Гидронасос',size:2,color:'#40a0c0',liqCap:40,powerUse:90,category:'liquid',desc:'6.6 воды/с на плодородной'}),
  [BTYPE.OIL_EXTRACTOR]:def({name:'Нефтяная вышка',size:2,color:'#2a1a0a',liqCap:40,itemCap:10,powerUse:180,category:'liquid',desc:'песок+вода → нефть'}),
  [BTYPE.CULTIVATOR]:def({name:'Культиватор',size:2,color:'#50a040',liqCap:60,itemCap:10,powerUse:80,category:'liquid',desc:'вода → споры'}),
  [BTYPE.POWER_NODE]:def({name:'Силовой узел',size:1,color:'#e0c040',powerRange:6,powerLinks:10,category:'power',desc:'ЛЭП 6'}),
  [BTYPE.LARGE_POWER_NODE]:def({name:'Больш. силовой узел',size:2,color:'#e0b030',powerRange:15,powerLinks:15,category:'power',desc:'ЛЭП 15'}),
  [BTYPE.SURGE_TOWER]:def({name:'Кинет. вышка',size:1,color:'#f3e03b',powerRange:40,powerLinks:2,category:'power',desc:'Дальность 40'}),
  [BTYPE.BATTERY]:def({name:'Аккумулятор',size:1,color:'#60c060',powerCap:4000,category:'power',desc:'4к'}),
  [BTYPE.LARGE_BATTERY]:def({name:'Больш. аккумулятор',size:2,color:'#50b050',powerCap:50000,category:'power',desc:'50к'}),
  [BTYPE.COMBUSTION]:def({name:'ДВС генератор',size:1,color:'#c07040',itemCap:10,powerGen:60,category:'power',fuels:{coal:1,spore:1.15,pyratite:1.4},desc:'60 э/с'}),
  [BTYPE.THERMAL_GEN]:def({name:'Терм. генератор',size:2,color:'#d06030',powerGen:108,category:'power',desc:'На раскалённых'}),
  [BTYPE.STEAM_GEN]:def({name:'Паровой ген.',size:2,color:'#a0b0c0',liqCap:60,itemCap:10,powerGen:330,category:'power',desc:'330 э/с'}),
  [BTYPE.DIFF_GEN]:def({name:'Дифф. генератор',size:3,color:'#80d0e0',liqCap:60,itemCap:10,powerGen:1080,category:'power',desc:'1080 э/с'}),
  [BTYPE.RTG]:def({name:'РТГ',size:2,color:'#c0a0d0',itemCap:10,powerGen:270,category:'power',desc:'Торий/фаза'}),
  [BTYPE.SOLAR]:def({name:'Солн. панель',size:1,color:'#4060a0',powerGen:7.2,category:'power',desc:'7.2 э/с днём'}),
  [BTYPE.LARGE_SOLAR]:def({name:'Больш. солн. панель',size:3,color:'#3050a0',powerGen:96,category:'power',desc:'96 э/с'}),
  [BTYPE.THORIUM_REACTOR]:def({name:'Ториевый реактор',size:3,color:'#e090c0',liqCap:30,itemCap:30,powerGen:900,category:'power',desc:'900 э/с'}),
  [BTYPE.IMPACT_REACTOR]:def({name:'Импульсный реактор',size:4,color:'#ff60a0',liqCap:80,itemCap:10,powerUse:1500,powerGen:7800,category:'power',desc:'+6300 нетто'}),
  [BTYPE.GRAPHITE_PRESS]:def({name:'Графит. пресс',size:2,color:'#707070',itemCap:10,category:'util',recipe:{in:{coal:2},out:{graphite:1},time:1.5},desc:'2 угля → графит'}),
  [BTYPE.MULTI_PRESS]:def({name:'Улучш. пресс',size:3,color:'#606060',liqCap:60,itemCap:20,powerUse:108,category:'util',recipe:{in:{coal:3,water:6},out:{graphite:2},time:.5},desc:'3у+6в → 2 графита'}),
  [BTYPE.SILICON_SMELTER]:def({name:'Кремн. плавильня',size:2,color:'#a0a0b0',itemCap:10,powerUse:30,category:'util',recipe:{in:{coal:1,sand:2},out:{silicon:1},time:.666},desc:'уголь+песок → кремний'}),
  [BTYPE.SILICON_CRUCIBLE]:def({name:'Кремн. тигель',size:3,color:'#9090a0',itemCap:30,powerUse:240,category:'util',recipe:{in:{coal:4,sand:6,pyratite:1},out:{silicon:8},time:5.333},desc:'→ 8 кремния'}),
  [BTYPE.KILN]:def({name:'Печь',size:2,color:'#c08040',itemCap:10,powerUse:36,category:'util',recipe:{in:{lead:1,sand:1},out:{metaglass:1},time:.5},desc:'свинец+песок → метастекло'}),
  [BTYPE.PLASTANIUM_COMPRESSOR]:def({name:'Пластан. компрессор',size:2,color:'#80c060',liqCap:60,itemCap:10,powerUse:180,category:'util',recipe:{in:{oil:15,titanium:2},out:{plastanium:1},time:1},desc:'нефть+титан → пластан'}),
  [BTYPE.PHASE_WEAVER]:def({name:'Фазовый ткач',size:2,color:'#b080e0',itemCap:10,powerUse:300,category:'util',recipe:{in:{thorium:4,sand:10},out:{phase:1},time:2},desc:'торий+песок → фаза'}),
  [BTYPE.SURGE_SMELTER]:def({name:'Плавильня кинет.',size:3,color:'#e0c040',itemCap:20,powerUse:240,category:'util',recipe:{in:{copper:3,lead:4,titanium:2,silicon:3},out:{surge:1},time:1.25},desc:'→ кинет. сплав'}),
  [BTYPE.CRYOFLUID_MIXER]:def({name:'Мешалка крио',size:2,color:'#60d0e0',liqCap:36,itemCap:10,powerUse:60,category:'util',recipe:{in:{titanium:1,water:12},out:{cryo:12},time:2},desc:'титан+вода → крио'}),
  [BTYPE.PYRATITE_MIXER]:def({name:'Мешалка пиротита',size:2,color:'#e06040',itemCap:10,powerUse:12,category:'util',recipe:{in:{coal:1,lead:2,sand:2},out:{pyratite:1},time:.75},desc:'→ пиротит'}),
  [BTYPE.BLAST_MIXER]:def({name:'Мешалка взрывн.',size:2,color:'#e04060',itemCap:10,powerUse:24,category:'util',recipe:{in:{pyratite:1,spore:1},out:{blast:1},time:.75},desc:'→ взрывная смесь'}),
  [BTYPE.MELTER]:def({name:'Плавильня',size:1,color:'#ff8040',liqCap:10,itemCap:10,powerUse:60,category:'util',recipe:{in:{metalom:1},out:{slag:12},time:.166},desc:'металлом → шлак'}),
  [BTYPE.SEPARATOR]:def({name:'Отделитель',size:2,color:'#a08060',liqCap:40,powerUse:66,category:'util',desc:'шлак → ресурсы'}),
  [BTYPE.DISASSEMBLER]:def({name:'Разборщик',size:3,color:'#908070',liqCap:72,itemCap:20,powerUse:240,category:'util',desc:'металлом+шлак → ресурсы'}),
  [BTYPE.SPORE_PRESS]:def({name:'Споровый пресс',size:2,color:'#60a040',liqCap:60,powerUse:42,category:'util',recipe:{in:{spore:1},out:{oil:18},time:.333},desc:'спора → нефть'}),
  [BTYPE.PULVERIZER]:def({name:'Измельчитель',size:1,color:'#a09070',itemCap:10,powerUse:30,category:'util',recipe:{in:{metalom:1},out:{sand:1},time:.666},desc:'металлом → песок'}),
  [BTYPE.COAL_CENTRIFUGE]:def({name:'Угольн. центриф.',size:2,color:'#505050',liqCap:60,powerUse:42,category:'util',recipe:{in:{oil:6},out:{coal:1},time:.5},desc:'нефть → уголь'}),
  [BTYPE.INCINERATOR]:def({name:'Мусоросжигатель',size:1,color:'#404040',powerUse:30,category:'util',desc:'Уничтожает'})
};

const CAT_MAP={util:[],logic:[],power:[],walls:[],transport:[],liquid:[],turret:[],drill:[]};
for(const [k,v] of Object.entries(BUILDING_DEFS)){
  const cat=v.category||'util';
  if(CAT_MAP[cat])CAT_MAP[cat].push(+k);
}
const CATEGORIES=[
  {id:'util',name:'Утилиты',side:'left',row:0,blocks:CAT_MAP.util},
  {id:'logic',name:'Логика',side:'right',row:0,blocks:[]},
  {id:'power',name:'Энергия',side:'left',row:1,blocks:CAT_MAP.power},
  {id:'walls',name:'Стены',side:'right',row:1,blocks:[]},
  {id:'transport',name:'Транспорт',side:'left',row:2,blocks:CAT_MAP.transport},
  {id:'liquid',name:'Жидкости',side:'right',row:2,blocks:CAT_MAP.liquid},
  {id:'turret',name:'Турели',side:'left',row:3,blocks:[]},
  {id:'drill',name:'Буры',side:'right',row:3,blocks:CAT_MAP.drill}
];
