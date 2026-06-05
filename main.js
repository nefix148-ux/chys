let scene, camera, renderer;
let player;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Простой город
  createCity();

  player = new Player(camera, scene);

  // Несколько NPC
  window.npcs = [];
  for(let i = 0; i < 8; i++) {
    const npc = new NPC(scene, i);
    window.npcs.push(npc);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function createCity() {
  // Земля
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshLambertMaterial({color: 0x555555})
  );
  ground.rotation.x = -Math.PI/2;
  scene.add(ground);

  // Простые здания
  for(let i = 0; i < 25; i++) {
    const h = Math.random()*15 + 5;
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(8, h, 8),
      new THREE.MeshLambertMaterial({color: Math.random() > 0.5 ? 0x888888 : 0x555555})
    );
    building.position.set(
      Math.random()*150 - 75,
      h/2,
      Math.random()*150 - 75
    );
    scene.add(building);
  }

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(50, 100, 30);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));
}

function animate() {
  requestAnimationFrame(animate);
  player.update();
  window.npcs.forEach(npc => npc.update());
  renderer.render(scene, camera);
}
