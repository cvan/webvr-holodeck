// url parameters
var parameters = (function() {
  var parameters = {};
  var parts = window.location.search.substr(1).split('&');
  for (var i = 0; i < parts.length; i++) {
    var parameter = parts[i].split('=');
    parameters[parameter[0]] = parameter[1];
  }
  return parameters;
})();

var camera;
var clock = new THREE.Clock();
var controls;
var counter = -1;
var effect;
var manager;
var orbitControls;
var overlay;
var pano;
var panoCurrent;
var renderer;
var scene;


function bend( group, amount, multiMaterialObject ) {
  function bendVertices( mesh, amount, parent ) {
    var vertices = mesh.geometry.vertices;

    if (!parent) {
      parent = mesh;
    }

    for (var i = 0; i < vertices.length; i++) {
      var vertex = vertices[i];

      // apply bend calculations on vertexes from world coordinates
      parent.updateMatrixWorld();

      var worldVertex = parent.localToWorld(vertex);

      var worldX = Math.sin( worldVertex.x / amount) * amount;
      var worldZ = - Math.cos( worldVertex.x / amount ) * amount;
      var worldY = worldVertex.y   ;

      // convert world coordinates back into local object coordinates.
      var localVertex = parent.worldToLocal(new THREE.Vector3(worldX, worldY, worldZ));
      vertex.x = localVertex.x;
      vertex.z = localVertex.z+amount;
      vertex.y = localVertex.y;
    }

    mesh.geometry.computeBoundingSphere();
    mesh.geometry.verticesNeedUpdate = true;
  }

  for ( var i = 0; i < group.children.length; i ++ ) {
    var element = group.children[ i ];

    if (element.geometry.vertices) {
      if (multiMaterialObject) {
        bendVertices( element, amount, group);
      } else {
        bendVertices( element, amount);
      }
    }
  }
}

function playAudio(url, opts) {
  return sfx.play(url, opts).then(function () {
    console.log('Playing audio: %s', url);
  }).catch(function (err) {
    console.error('Could not play audio (%s) \n', url, err);
  });
}


function loadPano(increment, fromHolodeck) {
  panosList.then(function (panos) {

    counter += increment;
    if (counter < 0) {
      counter = panos.length - 1;
    }
    if (counter === panos.length) {
      counter = 0;
    }

    panoCurrent = panos[counter];

    var imgPano = panoCurrent.image;
    var imgOverlay = panoCurrent.overlay;

    if (fromHolodeck) {
      playAudio('audio/holodeck_end_program.mp3');
    }

    // fade out current panorama.
    new TWEEN.Tween(pano.material)
      .to({opacity: 0}, 300)
      .onComplete(function () {
        // load in new panorama texture.
        pano.material.map = THREE.ImageUtils.loadTexture(imgPano, THREE.UVMapping, fadeIn);
      })
      .start();

    // fade out current title.
    new TWEEN.Tween(overlay.children[0].material)
      .to({opacity: 0}, 300)
      .onComplete(function () {
        // load in new title.
        overlay.children[0].material.map = THREE.ImageUtils.loadTexture(imgOverlay, THREE.UVMapping);
      })
      .start();

    // fade in newly loaded panorama.
    function fadeIn() {
      if (fromHolodeck) {
        playAudio('audio/hologram_off_2.mp3');
      }

      new TWEEN.Tween(pano.material)
        .to({opacity: 1}, 1000)
        .onComplete(fadeInOverlay)
        .start();
    }

    // fade in newly loaded title.
    function fadeInOverlay() {
      var panoAudio = panoCurrent.audio;
      if (panoAudio) {
        if (typeof panoAudio === 'string') {
          panoAudio = {src: panoAudio};
        }
        if (typeof panoAudio.loop === 'undefined') {
          panoAudio.loop = true;
        }
      }

      playAudio(panoAudio.src, panoAudio);

      new TWEEN.Tween(overlay.children[0].material)
        .to({opacity: 1}, 300)
        .start();
    }

  });
}


// initialize scene

function init() {

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.autoClear = false;
  renderer.setClearColor( 0x000000 );
  document.body.appendChild( renderer.domElement );

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 0.0001; // set camera position so that OrbitControls works properly
  scene.add(camera);

  // effect and controls for VR
  effect = new THREE.VREffect(renderer);
  controls = new THREE.VRControls(camera);

  // effect and controls for VR
  effect = new THREE.VREffect(renderer);
  controls = new THREE.VRControls(camera);
  orbitControls = new THREE.OrbitControls(camera);
  orbitControls.noZoom = true;

  // initialize the WebVR manager.
  manager = new WebVRManager(renderer, effect, {
    hideButton: true
  });

  // add background sound
  // var listener = new THREE.AudioListener();
  // camera.add( listener );

  // Fetch the JSON list of panos.
  panosList.then(function (panos) {

    // Load material and first panorama.
    loadMaterial().then(function () {
      return loadPano(1);
    });

    // Add background sounds.

    // Preload the sounds so we can play them later.
    var sfxToPreload = panos.map(function (pano) {
      return (pano.audio && pano.audio.src) || pano.audio;
    }).concat([
      'audio/hologram_on.mp3',
      'audio/hologram_off_2.mp3',
      'audio/holodeck_end_program.mp3'
    ]);

    return sfx.preload(sfxToPreload).then(function (sfxLoaded) {
      console.log(['Preloaded audio:'].concat(sfxLoaded).join('\n• '));
    }).catch(function (err) {
      console.log('Could not preload audio\n', err);
    });

  });

  // panorma mesh
  var geometry = new THREE.SphereGeometry( 1000, 60, 60 );
  geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );

  function loadMaterial() {
    return new Promise(function (resolve) {
      var material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        map: THREE.ImageUtils.loadTexture(
          'images/background.jpg', // load placeholder rexture
          THREE.UVMapping,
          resolve
        )
      });

      pano = new THREE.Mesh( geometry, material );
      pano.renderDepth = 2;
      pano.rotation.set( 0, -90 * Math.PI / 180, 0 );
      scene.add(pano);
    });
  }

  // title text
  overlay = new THREE.Object3D();
  var mesh = new THREE.Mesh(
    new THREE.PlaneGeometry( 63, 30, 20, 20 ),
    new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.5,
      side: THREE.FrontSide,
      map: THREE.ImageUtils.loadTexture('images/background-overlay.png')
  }));
  overlay.add( mesh );
  overlay.position.set( 0, -3, -5 );
  overlay.scale.set( 0.1, 0.1, 0.1 );
  bend(overlay, 100);
  mesh.renderDepth = 1;
  scene.add( overlay );

  window.addEventListener('resize', onWindowResize, false );

  function handlePostmessage(e) {
    if (e.data.mode == 'vr') {
      manager.enterVR();
    }

    if (e.data.mode == 'mono') {
      manager.exitVR();
    }
  }

  if (parameters.mode == 'vr') {
    manager.enterVR();
  }

  window.addEventListener('message', handlePostmessage);

  // trigger function that begins to animate the scene.
  new TWEEN.Tween()
    .delay(400)
    .onComplete(setupScene)
    .start();

  requestAnimationFrame(animate);
  onWindowResize();

}


function setupScene() {

  if (parameters.mode == 'vr') {
    manager.enterVR();
  }

}


function onkey(e) {
  panosList.then(function (panos) {

    if (e.keyCode == '90') {
      controls.zeroSensor();
    } else if (e.keyCode == '37') {
      loadPano(-1);
    } else if (e.keyCode == '39') {
      loadPano(1);
    }

  });

  e.stopPropagation();
}

window.addEventListener("keydown", onkey, true);


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  effect.setSize(window.innerWidth, window.innerHeight);
}


function animate() {

  requestAnimationFrame(animate);
  TWEEN.update();

  if (manager.isVRMode()) {
    effect.render(scene, camera);
    controls.update();
  } else {
    renderer.render(scene, camera);
    orbitControls.update();
  }
}


init();
