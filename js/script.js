// Vehicles Color
const Vehicles = {
    player: {
        color: [0xdb5e71]
    },
    npc: {
        type: ['car'],
    }
};

// Game Information
let GAME_ = {
    // General data
    status: false,
    score: 0,
    activeHonk: false,
    // Game data
    lastTimestamp: 0,
    angleMoved: 0,
    scoreAngle: 0,
    initialPos: (3/2) * Math.PI,
    speed: 0.001,
    carAcelerate: false,
    carDecelerate: false,
    // Estra data
    trafficLight: true, // True means Green
    trafficPenalty: false,
    trafficLightPosition: {x: 0, y: 0, z: 0}, // Calculate with help of the car position
    playerCar: false,
    npcCar: [],
    // Music
    playerHorn: new Audio('./source/playerHorn.mp3'),
    truckHorn: [],
    carHorn: [],
};

// Load Audios
// ------ Car
for(let i = 1; i <= 1; i++){
    GAME_.carHorn.push(new Audio(`./source/carHorn/carHorn${i}.mp3`));
}
// ------ Truck
for(let i = 1; i <= 1; i++){
    GAME_.truckHorn.push(new Audio(`./source/truckHorn/truckHorn${i}.mp3`));
}

// Define Variables
let scene, camera, renderer, trafficLightsRe, activeHonkRe;


// SOUNDS EFFECTS

function playCarHorn(){
    GAME_.carHorn[Math.floor(Math.random()*GAME_.carHorn.length)].play();

    return true;
}
function playTruckHorn(){
    GAME_.truckHorn[Math.floor(Math.random()*GAME_.truckHorn.length)].play();

    return true;
}

// GAME
window.addEventListener('load', ()=>{
    // Models
    function Car(type = 'npc'){
        function CarWheel(){
            return new THREE.Mesh(
                new THREE.BoxBufferGeometry(12, 33, 12),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
        }

        // Top Texture
        function CarFrontTexture(){
            const canvas = document.createElement('canvas');
            canvas.height = 32;
            canvas.width = 64;

            const context = canvas.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.fillStyle = '#568194';
            context.fillRect(8, 8, 48, 24);

            return new THREE.CanvasTexture(canvas);
        }
        function CarSideTexture(){
            const canvas = document.createElement('canvas');
            canvas.height = 32;
            canvas.width = 128;

            const context = canvas.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.fillStyle = '#568194';
            context.fillRect(58, 8, 60, 24);

            return new THREE.CanvasTexture(canvas);
        }
        
        const car = new THREE.Group();

        // Define textures
        let frontTexture = CarFrontTexture();
        frontTexture.center = new THREE.Vector2(0.5, 0.5);
        frontTexture.rotation = Math.PI / 2;

        let backTexture = CarFrontTexture();
        backTexture.center = new THREE.Vector2(0.5, 0.5);
        backTexture.rotation = -Math.PI / 2;

        let rightSideTexture = CarSideTexture();

        let leftSideTexture = CarSideTexture();
        leftSideTexture.flipY = false;

        const group = [
            CarWheel(),
            CarWheel(),
            new THREE.Mesh(
                new THREE.BoxBufferGeometry(60, 30, 15),
                new THREE.MeshLambertMaterial({ color : (type == 'player') ? '#db5e71' : randomColor() })
            ),
            new THREE.Mesh(
                new THREE.BoxBufferGeometry(33, 24, 12),
                [
                    new THREE.MeshLambertMaterial({ map: frontTexture }), // Front
                    new THREE.MeshLambertMaterial({ color: backTexture }), // Back
                    new THREE.MeshLambertMaterial({ map: leftSideTexture }),
                    new THREE.MeshLambertMaterial({ map: rightSideTexture }),
                    new THREE.MeshLambertMaterial({ color: 0xffffff }), // Top
                    new THREE.MeshLambertMaterial({ color: 0xffffff }) // Bottom
                ]
            ),
        ];

        group[0].position.z = 6;
        group[0].position.x = -18;

        group[1].position.z = 6;
        group[1].position.x = 18;

        group[2].position.z = 12;

        group[3].position.z = 25;
        group[3].position.x = -6;        


        // Add List
        group.forEach(el =>{
            car.add(el);
        });

        return car;
    }
    function Truck(){

    }
    function Map(width, height){
        function mapGradient(w, h){
            const canvas = document.createElement('canvas');

            canvas.height = h;
            canvas.width = w;

            let context = canvas.getContext('2d');

            context.fillStyle = "#546e90";
            context.fillRect(0, 0, w, h);

            // Circle marking
            context.lineWidth = 2;
            context.strokeStyle = '#ffffff';
            context.setLineDash([10, 16]);

            // Left circle
            context.beginPath();
            context.arc(
                (w / 2) - arcCenterX, // variable defined before
                (h / 2),
                trackRadius,
                angleJoin + (25 * (Math.PI/180)),
                (2*Math.PI) + (angleJoin - (2*(Math.PI/180)))
            );

            context.stroke();

            // Right circle
            context.beginPath();
            context.arc(
                (w / 2) + arcCenterX, // variable defined before
                (h / 2),
                trackRadius,
                0,
                (2 * Math.PI)
            );

            context.stroke();

            // Stop line
            context.setLineDash([]);
            context.beginPath();
            context.arc(
                (w / 2) - arcCenterX,
                (h / 2),
                trackRadius,
                angleJoin + (10 * (Math.PI/180)),
                angleJoin + (20 * (Math.PI/180))
            );
            
            context.stroke();

            // Stop text
            context.save();

            context.fillStyle = "#ffffff";
            context.font = '26px Arial';
            context.textAlign = "center";
            context.translate((w / 2) - arcCenterX, (h / 2));
            context.rotate(angleJoin + (7 * (Math.PI / 180)));
            context.fillText(
                'STOP',
                trackRadius,
                0
            );

            // Stop 
            context.lineWidth = 6;
            context.beginPath();
            context.moveTo(innerTrackRadius, 10);
            context.lineTo(outerTrackRadius, 10);

            context.stroke();
            
            context.restore()

            return new THREE.CanvasTexture(canvas);
        }
        
        // Island
        function middleIsland(){
            const island = new THREE.Shape();

            island.absarc(
                - arcCenterX,
                0,
                innerTrackRadius,
                centerAngle.inner,
                - centerAngle.inner,
                true
            );

            island.absarc(
                arcCenterX,
                0,
                innerTrackRadius,
                Math.PI + centerAngle.inner,
                Math.PI - centerAngle.inner, // Must be a continuo path
                true
            );

            return island;
        }
        function sideIsland(type){
            const island = new THREE.Shape();

            island.absarc(
                type == 'left' ? -arcCenterX : arcCenterX,
                0,
                innerTrackRadius,
                type == 'left' ? angleJoin : Math.PI + angleJoin,
                type == 'left' ? -angleJoin : Math.PI - angleJoin,
                false
            );

            island.absarc(
                type == 'left' ? arcCenterX : -arcCenterX,
                0,
                outerTrackRadius,
                type == 'left' ? Math.PI + arcAngle : arcAngle,
                type == 'left' ? Math.PI - arcAngle : -arcAngle, // Must be a continuo path
                true
            );

            return island;
        }
        function outerIsland(w, h){
            const field = new THREE.Shape();

            field.moveTo(-w/2, -h/2);
            field.lineTo(0, -h/2);

            // arc
            field.absarc(
                -arcCenterX,
                0,
                outerTrackRadius,
                -centerAngle.outer,
                centerAngle.outer,
                true
            );
            field.absarc(
                arcCenterX,
                0,
                outerTrackRadius,
                Math.PI - centerAngle.outer,
                Math.PI + centerAngle.outer,
                true
            );

            field.lineTo(0, -h/2);
            field.lineTo(w/2, -h/2);
            field.lineTo(w/2, h/2);
            field.lineTo(-w/2, h/2);

            return field;
        }

        // Render map
        const linearGradientPlaneColor = mapGradient(width, height);
        const plane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(width, height),
            new THREE.MeshLambertMaterial({
                map: linearGradientPlaneColor
            })
        );

        scene.add(plane);

        // Over island
        const leftIslandT = sideIsland('left');
        const rightIslandT = sideIsland('right');
        const middleIslandT = middleIsland();
        const outerIslandT = outerIsland(width, height);

        const field = new THREE.Mesh(
            new THREE.ExtrudeBufferGeometry(
                [leftIslandT, middleIslandT, rightIslandT, outerIslandT],
                {
                    depth: 10,
                    bevelEnabled: false
                }
            ),
            [
                new THREE.MeshLambertMaterial({ color: 0x5de371 }),
                new THREE.MeshLambertMaterial({ color: 0x36703e })
            ]
        );

        scene.add(field);
    }


    // Movement pack ===============
    function movePlayerCar(timeDelta){
        const playerSpeed = getPlayerSpeed();
        // Phisics: O = Oº + wt
        // But in this case the w are going to be dynamic so, the initial Oº will be reseted every frame.
        GAME_.angleMoved += playerSpeed * timeDelta;
        GAME_.scoreAngle += playerSpeed * timeDelta;
        // Playerspeed : w
        // timeDelta : t ; In radians
        // += because we want the player car can go around the circle in anticlock direction

        const totalAngleMoved = GAME_.initialPos + GAME_.angleMoved;


        // Player position
        playerCarPosition(totalAngleMoved);

    }
    function moveOtherCar(timeDelta){
        GAME_.npcCar.forEach(el =>{
            if(el.clockwise){
                el.angle -= (GAME_.speed * el.speed) * timeDelta;
            }else{
                el.angle += ((GAME_.speed * el.speed) * timeDelta);
            }

            // Vehicle position
            otherCarPosition(el);

        });
    }
    function playerCarPosition(angle){
        // Player position
        const playerX = Math.cos(angle) * trackRadius - arcCenterX; // Remove the center radius
        const playerY = Math.sin(angle) * trackRadius; // h in trigonometry

        GAME_.playerCar.position.x = playerX;
        GAME_.playerCar.position.y = playerY;

        // Tangent, 90º with the radius; Radius - 90º (90º = PI/2)
        GAME_.playerCar.rotation.z = angle + (Math.PI / 2)
    }
    function otherCarPosition(el){
        const realTrack = (el.clockwise) ? trackRadius - (trackSemiWidth/2) : trackRadius + (trackSemiWidth/2);

        const vehicleX = Math.cos(el.angle) * realTrack + arcCenterX;
        const vehicleY = Math.sin(el.angle) * realTrack;

        el.mesh.position.x = vehicleX;
        el.mesh.position.y = vehicleY;
        el.mesh.rotation.z = el.angle + (el.clockwise ? -(Math.PI/2) : (Math.PI/2));
    }
    function collisionDetectionOtherCar(){
        GAME_.npcCar.forEach((el, i) =>{
            const alpha = el.mesh.position;

            GAME_.npcCar.forEach(pr =>{
                // Get distance and stop runing once detected a vehicle forward de el vehicle
                // Only apply to the cars in the same rail
                if(el != pr){
                    if(pr.clockwise == el.clockwise){
                        const beta = pr.mesh.position;
                        const distance = getHitDistance(beta, alpha);
                        if(distance > 0 && distance <= 150){
                            if(distance <= 100){
                                GAME_.npcCar[i].speed = 0;
                            }else{
                                GAME_.npcCar[i].speed = 0.5;
                            }
                        }else{
                            if(distance == 0){
                                GAME_.npcCar[i].speed = 3; // Push it out
                            }else{
                                GAME_.npcCar[i].speed = getOtherSpeed(el.type) + (GAME_.activeHonk ? Math.random() : 0);
                            }
                        }
                    }
                }
            });
        });
    }
    function getPlayerSpeed(){
        // Dynamic speed with aceleration and deceleration
        return (GAME_.carAcelerate) ? GAME_.speed * 2 : ((GAME_.carDecelerate) ? GAME_.speed * 0.5 : GAME_.speed);
    }
    function getOtherSpeed(type){
        // Dynamic speed to every kind of vehicles
        switch (type) {
            case 'car':
                // Between 1 to 2
                return (Math. random() * (2 - 1)) + 1;
                break;

            case 'truck':
                // Between 0.6 to 1.5
                return (Math. random() * (1.5 - 0.6)) + 0.6;
                break;
            default:
                break;
        }
    }
    function writeScore(t){
        scoreDom.innerHTML = Math.floor(parseInt(t));
    }
    function randomColor(){
        // return `#${Math.floor(Math.random()*255).toString(16)}${Math.floor(Math.random()*255).toString(16)}${Math.floor(Math.random()*255).toString(16)}`;
        return `#${(0x1000000+Math.random()*0xffffff).toString(16).substr(1,6)}`;
    }
    function acelerateNpc(){
        clearTimeout(activeHonkRe);

        // Create session
        GAME_.activeHonk = true;

        activeHonkRe = setTimeout(() =>{
            GAME_.activeHonk = false;
        }, 1000);
    }
    function addNpcCar(){
        // Get a random one;
        var type = Vehicles.npc.type[Math.floor(Math.random()*Vehicles.npc.type.length)];

        const mesh = (type == 'car') ? Car() : Truck();
        scene.add(mesh);

        const clockwise = Math.random() <= 0.5;
        const speed = getOtherSpeed(type);
        const angle = (clockwise) ? 0 : (2 * Math.PI)

        GAME_.npcCar.push({type, mesh, clockwise, speed, angle});
    }
    function getHitPosition(center, angle, clockwise, distance){
        const directionalAngle = angle + (clockwise ? -(Math.PI / 2) : +(Math.PI / 2));

        return {
            x: center.x + Math.cos(directionalAngle) * distance,
            y: center.y + Math.sin(directionalAngle) * distance // Front and back points
        }
    }
    function getHitDistance(alpha, beta){
        // The distance between two points is the module of the vector AlphaBeta
        return Math.sqrt(
            ((beta.x - alpha.x) **2)
            +
            ((beta.y - alpha.y) **2)
        );
    }
    function hitDetection(){
        const playerHitZone1 = getHitPosition(
            GAME_.playerCar.position,
            GAME_.initialPos + GAME_.angleMoved,
            false,
            15
        );
        const playerHitZone2 = getHitPosition(
            GAME_.playerCar.position,
            GAME_.initialPos + GAME_.angleMoved,
            false,
            -15
        );
        // Why 15? 15 is the long width of the car from de middle

        // Check every vehicle collision
        const hit = GAME_.npcCar.some(el =>{
            switch (el.type) {
                case 'car':
                    const npcHitZone1 = getHitPosition(
                        el.mesh.position,
                        el.angle,
                        el.clockwise,
                        15
                    );
                    const npcHitZone2 = getHitPosition(
                        el.mesh.position,
                        el.angle,
                        el.clockwise,
                        -15
                    );

                    // Honk to the player when the npc is going to hit the player car
                    if(getHitDistance(npcHitZone1, playerHitZone1) < 80 ||
                       getHitDistance(npcHitZone1, playerHitZone2) < 80) // Head to player player head and ass car

                       playCarHorn();


                    // If the npc car and the player car hit points distance are under 40, it means that the the car has been collisioned in it hitbox
                    if(getHitDistance(playerHitZone1, npcHitZone1) < 40 ||
                       getHitDistance(playerHitZone1, npcHitZone2) < 40 ||
                       // Npc hits player
                       getHitDistance(npcHitZone1, playerHitZone1) < 40 ||
                       getHitDistance(npcHitZone1, playerHitZone2) < 40)

                        return true;

                    break;
                case 'truck':

                    break;
                default:
                    break;
            }
        });
        
        if(hit) end();
    }
    function trafficLightsDetection(){
        if(crossTrafficLights() && !GAME_.trafficPenalty){
            if(!GAME_.trafficLight){
                // Overwrite score
                GAME_.trafficPenalty = true;
                if((GAME_.score - 1) > 0){
                    GAME_.score -= 1;
                    GAME_.scoreAngle -= (2 * Math.PI); 

                    // Penalty UI
                    penaltyDom.classList.add('active');
                    setTimeout(()=>{
                        penaltyDom.classList.remove('active'); // HAS GOT CSS TRANSITION DELAY
                    }, 1100);
                }else{
                    GAME_.score = 0;
                    GAME_.scoreAngle = 0;
                }
                writeScore(GAME_.score);
            }
        }
    }
    function crossTrafficLights(){

        if(getHitDistance(GAME_.playerCar.position, GAME_.trafficLightPosition) < 40)

            return true;

        return false;
    }

    function setTrafficLights(){
        // let randomBolean = (Math.random() > 0.5) ? false : true;
        let randomBolean = !GAME_.trafficLight;

        GAME_.trafficLight = randomBolean;

        if(randomBolean){
            trafficDom.classList.remove('red');
            trafficDom.classList.add('green');
        }else{
            trafficDom.classList.remove('green');
            trafficDom.classList.add('red');
        }
    }

    // ============================

    function animation(time){
        if(!GAME_.lastTimestamp){
            GAME_.lastTimestamp = time;

            // Call back null
            return;
        }

        const timeDelta = time - GAME_.lastTimestamp;

        // Constant velocity
        // According to phisics law with circle movement 
        movePlayerCar(timeDelta);

        // Round scores
        const slaps = Math.floor((GAME_.scoreAngle - (Math.PI / 2)) / (Math.PI *2));
        if(slaps > GAME_.score){
            writeScore(slaps);
            // Overwrite score
            GAME_.score = slaps;

            // Reset Penalty
            GAME_.trafficPenalty = false;
        }

        // Other cars
        if ((GAME_.npcCar.length < (slaps + 1) / 5) && (GAME_.npcCar.length < 4)) addNpcCar();


        // Inspect NPC car Collision
        collisionDetectionOtherCar();

        moveOtherCar(timeDelta);

        // Traffic Lights
        trafficLightsDetection();

        GAME_.lastTimestamp = time;

        // Collision
        hitDetection();

        renderer.render(scene, camera);

    }
    // External Function
    function reset(){
        renderer.setAnimationLoop(null);

        // Reset scores
        GAME_.status = false;
        GAME_.score = 0;
        GAME_.round = 0;
        GAME_.angleMoved = 0;
        GAME_.lastTimestamp = 0;
        GAME_.scoreAngle = 0;

        // Reset Cars
        GAME_.npcCar.forEach(el => {
            scene.remove(el.mesh);
        });

        GAME_.npcCar = [];

        playerCarPosition(GAME_.initialPos);

        renderer.render(scene, camera);

        clearInterval(trafficLightsRe)
    }

    function start(){
        if(!GAME_.status){

            writeScore(0);

            GAME_.status = true;
            renderer.setAnimationLoop(animation);

            trafficLightsRe = setInterval(setTrafficLights, 5000);

            // Dom
            scoreDom.classList.add('active');
            resultAreaDom.classList.add('disable');
        }
    }

    function end(){
        reset();

        // Dom
        scoreDom.classList.remove('active');
        resultAreaDom.classList.remove('disable');
    }

    // Event key
    window.addEventListener('keydown', e => {
        console.log(e.key);
        if(GAME_.status){
            if(e.keyCode == 38){
                e.preventDefault();
    
                // Acelerate
                GAME_.carAcelerate = true;
            }
    
            if(e.keyCode == 40){
                e.preventDefault();
    
                GAME_.carDecelerate = true;
            }

             // Reset
            if(e.key == 'R' || e.key == 'r'){
                // Reset the game
                e.preventDefault();

                console.log('aaa');
                end(); // End the game

            }
            // Player Honk
            if(e.key == 'H' || e.key == 'h'){
                e.preventDefault();

                GAME_.playerHorn.play();
                // Add functionality
                acelerateNpc();
            }
        }
    });

    window.addEventListener('keyup', e => {
        if(GAME_.status){
            if(e.keyCode == 38){
                e.preventDefault();
    
                GAME_.carAcelerate = false;
            }
    
            if(e.keyCode == 40){
                e.preventDefault();
                GAME_.carDecelerate = false;
            }
        }
    });

    // Player Honk Button
    document.querySelector('.claxon-btn .push--flat').addEventListener('click', ()=>{
        GAME_.playerHorn.play();
        // Add functionality
        acelerateNpc();
    });
    // Joystick
    const brakeDom = document.querySelector('.joystick .brake')
    brakeDom.addEventListener('touchstart', e =>{
        e.preventDefault();
        // Acelerate
        GAME_.carDecelerate = true;

        // HTML animation
        brakeDom.classList.add('active');
    });
    brakeDom.addEventListener('touchend', e =>{
        e.preventDefault();
        // Acelerate
        GAME_.carDecelerate = false;

        // HTML animation
        brakeDom.classList.remove('active');
    });

    const upDom = document.querySelector('.joystick .up')
    upDom.addEventListener('touchstart', e =>{
        e.preventDefault();
        // Acelerate
        GAME_.carAcelerate = true;

        // HTML animation
        upDom.classList.add('active');
    });
    upDom.addEventListener('touchend', e =>{
        e.preventDefault();
        // Acelerate
        GAME_.carAcelerate = false;

        // HTML animation
        upDom.classList.remove('active');
    });

    // Start Game
    const resultAreaDom = document.querySelector('.result-area');
    window.addEventListener('keypress', e=>{
        if(e.keyCode == 32) start();
    });
    resultAreaDom.addEventListener('touchend', start);

    /* ======================= */
    scene = new THREE.Scene();

    /* =======================
        Lights Configuration
    ==========================*/
    // Ambient Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional Lights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(100, -300, 400);
    scene.add(directionalLight);

    /* =======================
        Camera Configuration
    =========================*/
    // Perspective Camera
    // let aspectRatio = window.innerWidth / window.innerHeight;
    // const camera = new THREE.PerspectiveCamera(
    //     20,
    //     aspectRatio,
    //     60, // near
    //     100 // far
    // );

    // Orthographic Camera
    let aspectRatio =  window.innerWidth / window.innerHeight;
    let cameraWidth = 1500; // Changeble
    let cameraHeight = cameraWidth / aspectRatio

    camera = new THREE.OrthographicCamera(
        cameraWidth / -2, // left
        cameraWidth / 2, // right
        cameraHeight / 2, // top
        cameraHeight / -2, // bottom
        0, // near
        1000 // far
    )

    camera.position.set(0, -280, 400);
    // camera.position.set(0, 0, 300); /* Test */
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    /* ===================
        Map
    ====================== */
    // Draw track
    const trackRadius = 225;
    const trackSemiWidth = 45;

    const innerTrackRadius = trackRadius - trackSemiWidth;
    const outerTrackRadius = trackRadius + trackSemiWidth;

    const angleJoin = (1 / 3) * Math.PI // 60º

    const deltaY = Math.sin(angleJoin) * innerTrackRadius;
    const arcAngle = Math.asin(deltaY / outerTrackRadius);

    const arcCenterX = (Math.cos(angleJoin) * innerTrackRadius + Math.cos(arcAngle) * outerTrackRadius) / 2

    const centerAngle = {
        inner: Math.acos(arcCenterX / innerTrackRadius),
        outer: Math.acos(arcCenterX / outerTrackRadius)
    }

    /* =================
    Track Game
    ================== */
    const scoreDom = document.querySelector('.best-score');
    const penaltyDom = document.querySelector('.penalty');
    const trafficDom = document.querySelector('.traffic');




    

    // Render Map
    Map(cameraWidth, (cameraHeight * 2) + window.innerHeight);
    // Map(cameraWidth-100, cameraHeight); /* Test */

    GAME_.playerCar = Car('player');
    scene.add(GAME_.playerCar); // Player Car













    /* =================
        Render
    ==================== */
    renderer = new THREE.WebGLRenderer({ antialias : true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Set Traffic lights position
    GAME_.trafficLightPosition.x = Math.cos(2*Math.PI - angleJoin) * trackRadius - arcCenterX; // Remove the center radius
    GAME_.trafficLightPosition.y = Math.sin(2*Math.PI - angleJoin) * trackRadius;


    // Clean the map before starting the game
    reset();




    document.body.appendChild(renderer.domElement);


    // Detect orientation
    window.addEventListener("orientationchange", function() {
        if(window.orientation != 0 && window.orientation != 180){
            window.location.reload()
        };
    }, false);
});