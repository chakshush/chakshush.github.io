import * as $ from "//unpkg.com/three@0.124.0/build/three.module.js";
import { OrbitControls } from "//unpkg.com/three@0.124.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "//unpkg.com/three@0.124.0/examples/jsm/postprocessing/EffectComposer";
import { ShaderPass } from "//unpkg.com/three@0.124.0/examples/jsm/postprocessing/ShaderPass";
import { CopyShader } from "//unpkg.com/three@0.124.0/examples/jsm/shaders/CopyShader";
// ---- boot

const renderer = new $.WebGLRenderer({});
const scene = new $.Scene();
const camera = new $.PerspectiveCamera(100, 2, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
window.addEventListener("resize", () => {
  const { clientWidth, clientHeight } = renderer.domElement;
  renderer.setSize(clientWidth, clientHeight, false);
  renderer.setPixelRatio(window.devicePixelRatio);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
});
document.body.prepend(renderer.domElement);
window.dispatchEvent(new Event("resize"));

// ---- setup

camera.position.set(-1, 1, 8);
renderer.shadowMap.enabled = true;
scene.background = new $.Color("cornsilk");

const light0 = new $.DirectionalLight("cornsilk", 2.45);
light0.position.set(2, 5, 1);
light0.castShadow = true;
light0.shadow.bias = -0.004;
scene.add(light0);

// ---- shader

//https://unsplash.com/photos/Id6U55AZMpg
const url0 =
  "https://images.unsplash.com/photo-1593529467220-9d721ceb9a78?ixid=MXwxMjA3fDB8MHxzZWFyY2h8Mjh8fGZhY2V8ZW58MHx8MHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=60";
const pass0 = new ShaderPass({
  uniforms: $.UniformsUtils.merge([
    CopyShader.uniforms,
    {
      t: { value: 0 },
      map: { value: null },
    },
  ]),
  vertexShader: CopyShader.vertexShader,
  fragmentShader: `
    #define SPEED 0.68
    #define OFFSET (texel.r * 7.0)
    uniform sampler2D map;
    uniform float t;
    varying vec2 vUv;
    void main() {
        vec4 texel = texture2D(map, vUv);
        float h = sin((-t*0.01-OFFSET+dot(vUv,vUv))*SPEED)*0.5+0.5; 
        gl_FragColor = vec4(h, 0.0, 0.0, 1.0);
    }
    `,
});
const tex0 = new $.TextureLoader().load(url0, (t) =>
  mesh.scale.set(t.image.width / t.image.height, 1, 1)
);
pass0.material.uniforms.map.value = tex0;

// ---- gen disp map

const composer = new EffectComposer(renderer);
composer.renderToScreen = false;
composer.addPass(pass0);
window.addEventListener("resize", () => {
  composer.setPixelRatio(devicePixelRatio);
  composer.setSize(
    renderer.domElement.clientWidth,
    renderer.domElement.clientHeight
  );
});

// ---- clay

const mesh = new $.Mesh(
  new $.PlaneBufferGeometry(10, 10, 512, 512),
  new $.MeshStandardMaterial({
    displacementMap: null,
    displacementScale: 2,
    displacementBias: 1,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
  })
);
mesh.castShadow = mesh.receiveShadow = true;
mesh.customDepthMaterial = new $.MeshDepthMaterial({
  depthPacking: $.RGBADepthPacking,
  displacementMap: mesh.material.displacementMap,
  displacementScale: mesh.material.displacementScale,
  displacementBias: mesh.material.displacementBias,
});
scene.add(mesh);

// ---- wall

const wall = new $.Mesh(
  new $.PlaneBufferGeometry(100, 100),
  new $.ShadowMaterial()
);
wall.receiveShadow = true;
scene.add(wall);

// ---- anim

renderer.setAnimationLoop((t) => {
  composer.render();
  mesh.material.displacementMap = mesh.customDepthMaterial.displacementMap =
    composer.readBuffer.texture;
  renderer.render(scene, camera);
  controls.update();
  pass0.material.uniforms.t.value = t;
  const a = t * 0.001;
  light0.position.set(7 * Math.sin(a), 7 * Math.cos(a), 3);
});
