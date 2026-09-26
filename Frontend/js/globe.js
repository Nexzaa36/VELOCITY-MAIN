// ======================================
// RUNFOLD 2.0
// ANIMATED GLOBE BACKGROUND
// ======================================

document.addEventListener("DOMContentLoaded", function () {

    const container = document.getElementById("globe-background");

    if (!container || typeof THREE === "undefined") {
        return;
    }

    // -------------------------------
    // SCENE
    // -------------------------------

    const scene = new THREE.Scene();

    // -------------------------------
    // CAMERA
    // -------------------------------

    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );

    camera.position.z = 3.1;

    // -------------------------------
    // RENDERER
    // -------------------------------

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    renderer.setClearColor(0x000000, 0);

    container.appendChild(renderer.domElement);

    // -------------------------------
    // GLOBE GROUP
    // -------------------------------

    const globe = new THREE.Group();

    scene.add(globe);

    // -------------------------------
    // GLOBE
    // -------------------------------

    const globeGeometry = new THREE.SphereGeometry(
        1,
        64,
        64
    );

    const globeMaterial = new THREE.MeshBasicMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.035,
        wireframe: true
    });

    const globeMesh = new THREE.Mesh(
        globeGeometry,
        globeMaterial
    );

    globe.add(globeMesh);

    // -------------------------------
    // LATITUDE / LONGITUDE LINES
    // -------------------------------

    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.08
    });

    // Latitude lines
    for (let lat = -75; lat <= 75; lat += 15) {

        const points = [];

        const radius = Math.cos(
            THREE.MathUtils.degToRad(lat)
        );

        const y = Math.sin(
            THREE.MathUtils.degToRad(lat)
        );

        for (let i = 0; i <= 64; i++) {

            const angle =
                (i / 64) * Math.PI * 2;

            points.push(
                new THREE.Vector3(
                    radius * Math.cos(angle),
                    y,
                    radius * Math.sin(angle)
                )
            );
        }

        const geometry =
            new THREE.BufferGeometry().setFromPoints(points);

        const line =
            new THREE.Line(geometry, lineMaterial);

        globe.add(line);
    }

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 15) {

        const points = [];

        const longitude =
            THREE.MathUtils.degToRad(lng);

        for (let i = 0; i <= 64; i++) {

            const latitude =
                -Math.PI / 2 +
                (i / 64) * Math.PI;

            const x =
                Math.cos(latitude) *
                Math.cos(longitude);

            const y =
                Math.sin(latitude);

            const z =
                Math.cos(latitude) *
                Math.sin(longitude);

            points.push(
                new THREE.Vector3(x, y, z)
            );
        }

        const geometry =
            new THREE.BufferGeometry().setFromPoints(points);

        const line =
            new THREE.Line(geometry, lineMaterial);

        globe.add(line);
    }

    // -------------------------------
    // SUBTLE DOT FIELD
    // -------------------------------

    const dotMaterial =
        new THREE.PointsMaterial({
            color: 0x111111,
            size: 0.012,
            transparent: true,
            opacity: 0.18
        });

    const dotPositions = [];

    for (let i = 0; i < 900; i++) {

        const theta =
            Math.random() * Math.PI * 2;

        const phi =
            Math.acos(
                2 * Math.random() - 1
            );

        const radius = 1.012;

        const x =
            radius *
            Math.sin(phi) *
            Math.cos(theta);

        const y =
            radius *
            Math.cos(phi);

        const z =
            radius *
            Math.sin(phi) *
            Math.sin(theta);

        dotPositions.push(x, y, z);
    }

    const dotGeometry =
        new THREE.BufferGeometry();

    dotGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            dotPositions,
            3
        )
    );

    const dots =
        new THREE.Points(
            dotGeometry,
            dotMaterial
        );

    globe.add(dots);

    // -------------------------------
    // INITIAL POSITION
    // -------------------------------

    globe.rotation.x =
        THREE.MathUtils.degToRad(-8);

    globe.rotation.y =
        THREE.MathUtils.degToRad(-25);

    // -------------------------------
    // ANIMATION
    // -------------------------------

    function animate() {

        requestAnimationFrame(animate);

        globe.rotation.y += 0.0018;

        renderer.render(
            scene,
            camera
        );
    }

    animate();

    // -------------------------------
    // RESPONSIVE
    // -------------------------------

    function resizeGlobe() {

        const width =
            container.clientWidth;

        const height =
            container.clientHeight;

        if (!width || !height) {
            return;
        }

        camera.aspect =
            width / height;

        camera.updateProjectionMatrix();

        renderer.setSize(
            width,
            height
        );
    }

    window.addEventListener(
        "resize",
        resizeGlobe
    );

    resizeGlobe();

});