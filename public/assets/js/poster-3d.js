
// Three.js Implementation for Cinematic Folded Poster

document.addEventListener('DOMContentLoaded', () => {
    initPoster3D();
});

function initPoster3D() {
    const container = document.getElementById('poster-3d-container');
    if (!container) return;

    // SCENE SETUP
    const scene = new THREE.Scene();

    // CAMERA
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 10;
    camera.position.y = 0;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding; // CORRECT COLOR
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);

    // TEXTURE LOADER
    const textureLoader = new THREE.TextureLoader();
    const posterTexture = textureLoader.load('public/assets/images/illustrators/poster_dark.png');
    posterTexture.encoding = THREE.sRGBEncoding;

    // ---------------------------------------------------------
    // GEOMETRY: The Folded Poster
    // ---------------------------------------------------------

    const segX = 20;
    const segY = 20;
    const geometry = new THREE.PlaneGeometry(5, 7.5, segX, segY);

    const positions = geometry.attributes.position;

    // Apply "Fold" Logic to vertices
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        let z = positions.getZ(i);

        // Fold Logic (Same as before)
        const foldDepth = 0.15;

        let distX = Math.abs(x);
        if (distX < 2.5) {
            z += (1 - Math.min(distX, 1)) * foldDepth * -0.5;
        }

        let distY = Math.abs(y);
        if (distY < 3.75) {
            z += (1 - Math.min(distY, 1)) * foldDepth * -0.5;
        }

        // const noise = (Math.sin(x * 5) * Math.cos(y * 4)) * 0.05;
        // z += noise; // Crumple removed

        z -= (x * x) * 0.02;

        positions.setZ(i, z);
    }

    geometry.computeVertexNormals();

    // MATERIAL - White color to respect original texture
    const material = new THREE.MeshStandardMaterial({
        map: posterTexture,
        side: THREE.DoubleSide,
        roughness: 0.5,
        metalness: 0.1,
        bumpScale: 0.02,
        color: 0xffffff // Pure white base
    });

    const posterMesh = new THREE.Mesh(geometry, material);
    posterMesh.castShadow = true;
    posterMesh.receiveShadow = true;

    // Add a group to hold poster + stand to rotate together
    const group = new THREE.Group();
    group.add(posterMesh);

    // Initial Tilt: Face SLIGHTLY LEFT (Negative Y)
    group.rotation.y = -0.15;
    group.rotation.z = -0.02;

    // ---------------------------------------------------------
    // GEOMETRY: The Stand (Base + Leg)
    // ---------------------------------------------------------

    const baseGeo = new THREE.BoxGeometry(4.5, 0.1, 0.3);
    const standMat = new THREE.MeshStandardMaterial({
        color: 0x111111, // Dark metallic, no color
        roughness: 0.2,
        metalness: 0.8
    });

    const baseMesh = new THREE.Mesh(baseGeo, standMat);
    baseMesh.position.y = -3.85;
    baseMesh.position.z = -0.2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Back Leg
    const legGeo = new THREE.BoxGeometry(0.2, 7, 0.1);
    const legMesh = new THREE.Mesh(legGeo, standMat);

    legMesh.position.z = -1.5;
    legMesh.position.y = -0.5;
    legMesh.rotation.x = -0.3;
    legMesh.castShadow = true;
    group.add(legMesh);

    scene.add(group);


    // ---------------------------------------------------------
    // LIGHTING - Adjusted for True Colors
    // ---------------------------------------------------------

    // High Ambient Light to preserve original colors
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Key Light - White (No orange tint)
    const spotLight = new THREE.SpotLight(0xffffff, 1.2);
    spotLight.position.set(5, 5, 10);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 50;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    scene.add(spotLight);

    // Rim Light
    const rimLight = new THREE.PointLight(0xffffff, 0.2);
    rimLight.position.set(-5, 0, -5);
    scene.add(rimLight);

    // Fill Light
    const fillLight = new THREE.PointLight(0x6a1b9a, 0.3);
    fillLight.position.set(0, -5, 5);
    scene.add(fillLight);


    // ---------------------------------------------------------
    // ANIMATION & INTERACTION
    // ---------------------------------------------------------

    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    document.addEventListener('mousemove', (event) => {
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // 1. Subtle Floating
        group.position.y = Math.sin(time * 0.5) * 0.05;

        // 2. Mouse Interaction
        // Center rotation around -0.15 (Subtle Left tilt)
        targetRotationY = -0.15 + (mouseX * 0.1);
        targetRotationX = mouseY * 0.05;

        group.rotation.y += (targetRotationY - group.rotation.y) * 3 * delta;
        group.rotation.x += (targetRotationX - group.rotation.x) * 3 * delta;

        // Spotlight
        spotLight.intensity = 1.2 + Math.sin(time * 2) * 0.1;

        renderer.render(scene, camera);
    }

    animate();


    // ---------------------------------------------------------
    // RESIZE HANDLER
    // ---------------------------------------------------------
    window.addEventListener('resize', () => {
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    });
}
