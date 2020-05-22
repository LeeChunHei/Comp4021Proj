import { URDFModel } from '/javascripts/urdf.js';
import * as THREE from '/javascripts/threejs/build/three.module.js';
import Stats from '/javascripts/threejs/examples/jsm/libs/stats.module.js';
import { STLLoader } from '/javascripts/threejs/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from '/javascripts/threejs/examples/jsm/controls/OrbitControls.js';

var container, stats;
var camera, cameraTarget, scene, renderer, controls;
var div_changing = false;

init();
var humanoid = new URDFModel('/urdf/humanoid.urdf', scene, THREE, STLLoader);
animate();

function init() {

    container = document.getElementById('render_window');

    camera = new THREE.PerspectiveCamera(35, (container.clientWidth) / (container.clientHeight), 1, 15);
    camera.position.set(3, 0.15, 3);

    cameraTarget = new THREE.Vector3(0, 0, 0);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x72645b);
    scene.fog = new THREE.Fog(0x72645b, 2, 15);

    var axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Ground

    var plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(40, 40),
        new THREE.MeshPhongMaterial({ color: 0x999999, specular: 0x101010 })
    );
    plane.rotation.x = - Math.PI / 2;
    plane.position.y = - 0.5;
    scene.add(plane);

    plane.receiveShadow = true;

    // Lights

    scene.add(new THREE.HemisphereLight(0x443333, 0x111122));

    addShadowedLight(1, 1, 1, 0xffffff, 1.35);
    addShadowedLight(0.5, 1, - 1, 0xffaa00, 1);
    // renderer

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;

    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);

    // stats

    stats = new Stats();
    container.appendChild(stats.domElement);

    //

    window.addEventListener('resize', onWindowResize, false);
    let resizeObserver = new ResizeObserver(() => { 
        onWindowResize();
    }); 
      
    resizeObserver.observe(container); 


    //Camera control
    controls = new OrbitControls(camera, renderer.domElement);

    //controls.update() must be called after any manual changes to the camera's transform
    // camera.position.set(0, 20, 100);
    controls.update();
    controls.enableKeys = true;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.keys = {
        LEFT: 37, //left arrow
        UP: 38, // up arrow
        RIGHT: 39, // right arrow
        BOTTOM: 40 // down arrow
    };

    // function animate() {

    //     requestAnimationFrame(animate);

    //     // required if controls.enableDamping or controls.autoRotate are set to true
    //     controls.update();

    //     renderer.render(scene, camera);

    // }
}

function addShadowedLight(x, y, z, color, intensity) {

    var directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.set(x, y, z);
    scene.add(directionalLight);

    directionalLight.castShadow = true;

    var d = 1;
    directionalLight.shadow.camera.left = - d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = - d;

    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 4;

    directionalLight.shadow.bias = - 0.002;

}

function onWindowResize() {

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight);

}
var add = true;
function animate() {

    requestAnimationFrame(animate);
    // if (t !== undefined) {
    //     var angle = 0;
    //     if (add) {
    //         angle = t.getJointAngle('1') + Math.PI / 100
    //     } else {
    //         angle = t.getJointAngle('1') - Math.PI / 100
    //     }
    //     if (angle > Math.PI || angle < -Math.PI) {
    //         add = !add;
    //     }
    //     t.setJointAngle('1', angle);
    // }
    if(div_changing){
        onWindowResize();
    }
    controls.update();
    render();
    stats.update();

}

function render() {

    var timer = Date.now() * 0.0005;

    // camera.position.x = Math.cos(timer) * 3;
    // camera.position.z = Math.sin(timer) * 3;

    camera.lookAt(cameraTarget);

    renderer.render(scene, camera);

}

function divChanging(changing){
    div_changing = changing
}

function setJointAngle(name, angle){
    humanoid.setJointAngle(name, angle * Math.PI / 180);
}

export {divChanging, setJointAngle};