"use strict";

/* =====================================================
   COIN RUSH ARENA
   COMPLETE UPGRADED JAVASCRIPT
===================================================== */


/* =====================================================
   CANVAS
===================================================== */

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

let width =
    window.innerWidth;

let height =
    window.innerHeight;


function resizeCanvas(){

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    width =
        window.innerWidth;

    height =
        window.innerHeight;

    canvas.width =
        width * dpr;

    canvas.height =
        height * dpr;

    canvas.style.width =
        width + "px";

    canvas.style.height =
        height + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}


window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =====================================================
   GAME SETTINGS
===================================================== */

let playerCount = 2;

let pointsToWin = 20;

let gameDuration = 120;

let running = false;

let gamePaused = false;

let startTime = 0;

let lastFrame = 0;

let pausedAt = 0;

let players = [];

let coins = [];

let traps = [];

let powerItems = [];

let coinSpawnTimer = 0;

let trapSpawnTimer = 0;

let powerSpawnTimer = 0;

let noticeTimer = null;


/* =====================================================
   CHARACTERS
===================================================== */

const characters = {

    robot:"🤖",

    cat:"🐱",

    fox:"🦊",

    alien:"👽",

    ninja:"🥷",

    bear:"🐻",

    ghost:"👻",

    dragon:"🐲"

};


const characterNames = {

    robot:"Robot",

    cat:"Cat",

    fox:"Fox",

    alien:"Alien",

    ninja:"Ninja",

    bear:"Bear",

    ghost:"Ghost",

    dragon:"Dragon"

};


const playerColors = [

    "#ff4d6d",

    "#4dabf7",

    "#51cf66",

    "#ffd43b"

];


let selectedCharacters = [

    "robot",

    "cat",

    "fox",

    "dragon"

];


/* =====================================================
   COINS
===================================================== */

const coinTypes = [

    {
        name:"Copper",
        value:1,
        color:"#b87333",
        glow:"#e0a16d",
        rarity:55
    },

    {
        name:"Silver",
        value:2,
        color:"#d9dee5",
        glow:"#ffffff",
        rarity:28
    },

    {
        name:"Gold",
        value:3,
        color:"#ffd43b",
        glow:"#fff3a3",
        rarity:13
    },

    {
        name:"Diamond",
        value:5,
        color:"#63e6ff",
        glow:"#d9fbff",
        rarity:4
    }

];


/* =====================================================
   POWERS
===================================================== */

const powers = [

    {
        name:"Speed Burst",
        icon:"⚡",
        duration:7000,
        color:"#ffd43b"
    },

    {
        name:"Coin Magnet",
        icon:"🧲",
        duration:8000,
        color:"#ff6b6b"
    },

    {
        name:"Shield",
        icon:"🛡️",
        duration:10000,
        color:"#74c0fc"
    },

    {
        name:"Coin Blast",
        icon:"💥",
        duration:0,
        color:"#ff922b"
    },

    {
        name:"Phase",
        icon:"👻",
        duration:7000,
        color:"#b197fc"
    }

];


/* =====================================================
   TOUCH CONTROLS
===================================================== */

const controls = {

    1:{
        up:false,
        down:false,
        left:false,
        right:false
    },

    2:{
        up:false,
        down:false,
        left:false,
        right:false
    },

    3:{
        up:false,
        down:false,
        left:false,
        right:false
    },

    4:{
        up:false,
        down:false,
        left:false,
        right:false
    }

};


/* =====================================================
   KEYBOARD CONTROLS
===================================================== */

const keyboardControls = {

    1:{
        up:"w",
        down:"s",
        left:"a",
        right:"d"
    },

    2:{
        up:"ArrowUp",
        down:"ArrowDown",
        left:"ArrowLeft",
        right:"ArrowRight"
    },

    3:{
        up:"i",
        down:"k",
        left:"j",
        right:"l"
    },

    4:{
        up:"8",
        down:"5",
        left:"4",
        right:"6"
    }

};


const keys = {};


/* =====================================================
   KEYBOARD
===================================================== */

window.addEventListener(
    "keydown",
    event => {

        keys[event.key] = true;

        if (
            event.key === "Escape" &&
            running
        ){

            togglePause();

        }

    }
);


window.addEventListener(
    "keyup",
    event => {

        keys[event.key] = false;

    }
);


/* =====================================================
   MOBILE CONTROL BUTTONS
===================================================== */

document
    .querySelectorAll(".control")
    .forEach(button => {

        const player =
            Number(
                button.dataset.player
            );

        const direction =
            button.dataset.key;


        function press(event){

            event.preventDefault();

            if (
                gamePaused ||
                !controls[player]
            ){

                return;

            }

            controls[player][direction] =
                true;

            button.classList.add(
                "pressed"
            );

        }


        function release(event){

            event.preventDefault();

            if (!controls[player])
                return;

            controls[player][direction] =
                false;

            button.classList.remove(
                "pressed"
            );

        }


        button.addEventListener(
            "pointerdown",
            press
        );

        button.addEventListener(
            "pointerup",
            release
        );

        button.addEventListener(
            "pointercancel",
            release
        );

        button.addEventListener(
            "pointerleave",
            release
        );

    });


/* =====================================================
   GET MOVEMENT
===================================================== */

function getDirection(playerId){

    const touch =
        controls[playerId];

    const keyboard =
        keyboardControls[playerId];

    let dx = 0;

    let dy = 0;


    if (
        touch.left ||
        keys[keyboard.left]
    ){

        dx--;

    }


    if (
        touch.right ||
        keys[keyboard.right]
    ){

        dx++;

    }


    if (
        touch.up ||
        keys[keyboard.up]
    ){

        dy--;

    }


    if (
        touch.down ||
        keys[keyboard.down]
    ){

        dy++;

    }


    if (
        dx !== 0 ||
        dy !== 0
    ){

        const length =
            Math.hypot(
                dx,
                dy
            );

        dx /= length;

        dy /= length;

    }


    return {
        dx,
        dy
    };

}


/* =====================================================
   PLAYER BOUNDARIES
===================================================== */

function getPlayerBounds(playerId){

    const margin = 35;

    if (playerCount === 2){

        if (playerId === 1){

            return {

                left:margin,

                right:
                    width - margin,

                top:95,

                bottom:
                    height / 2 - 8

            };

        }


        return {

            left:margin,

            right:
                width - margin,

            top:
                height / 2 + 8,

            bottom:
                height - margin

        };

    }


    if (playerCount === 3){

        if (playerId === 1){

            return {

                left:margin,

                right:
                    width - margin,

                top:95,

                bottom:
                    height * .38

            };

        }


        if (playerId === 2){

            return {

                left:margin,

                right:
                    width - margin,

                top:
                    height * .62,

                bottom:
                    height - margin

            };

        }


        return {

            left:margin,

            right:
                width * .46,

            top:
                height * .38,

            bottom:
                height * .62

        };

    }


    const midX =
        width / 2;

    const midY =
        height / 2;


    if (playerId === 1){

        return {

            left:margin,

            right:
                midX - 8,

            top:95,

            bottom:
                midY - 8

        };

    }


    if (playerId === 2){

        return {

            left:
                midX + 8,

            right:
                width - margin,

            top:95,

            bottom:
                midY - 8

        };

    }


    if (playerId === 3){

        return {

            left:margin,

            right:
                midX - 8,

            top:
                midY + 8,

            bottom:
                height - margin

        };

    }


    return {

        left:
            midX + 8,

        right:
            width - margin,

        top:
            midY + 8,

        bottom:
            height - margin

    };

}


/* =====================================================
   KEEP PLAYER INSIDE AREA
===================================================== */

function keepPlayerInsideArea(player){

    const bounds =
        getPlayerBounds(
            player.id
        );

    const r =
        player.radius;


    player.x =
        Math.max(
            bounds.left + r,
            Math.min(
                bounds.right - r,
                player.x
            )
        );


    player.y =
        Math.max(
            bounds.top + r,
            Math.min(
                bounds.bottom - r,
                player.y
            )
        );

}


/* =====================================================
   RANDOM POSITION
===================================================== */

function randomPlayerPosition(
    playerId
){

    const bounds =
        getPlayerBounds(
            playerId
        );

    const padding = 35;


    return {

        x:
            bounds.left +
            padding +
            Math.random() *
            Math.max(
                1,
                bounds.right -
                bounds.left -
                padding * 2
            ),

        y:
            bounds.top +
            padding +
            Math.random() *
            Math.max(
                1,
                bounds.bottom -
                bounds.top -
                padding * 2
            )

    };

}


/* =====================================================
   RANDOM COIN
===================================================== */

function getRandomCoinType(){

    const roll =
        Math.random() * 100;

    let total = 0;


    for (
        const coin
        of coinTypes
    ){

        total +=
            coin.rarity;


        if (
            roll <= total
        ){

            return coin;

        }

    }


    return coinTypes[0];

}


/* =====================================================
   SPAWN COIN
   EVERY 2 SECONDS
   LASTS 4 SECONDS
===================================================== */

function spawnCoin(){

    const playerId =
        1 +
        Math.floor(
            Math.random() *
            playerCount
        );


    const pos =
        randomPlayerPosition(
            playerId
        );


    const now =
        performance.now();


    coins.push({

        x:pos.x,

        y:pos.y,

        radius:12,

        type:
            getRandomCoinType(),

        area:
            playerId,

        born:now,

        expires:
            now + 4000,

        pulse:
            Math.random() *
            Math.PI * 2

    });

}


/* =====================================================
   SPAWN TRAP
   EVERY 30 SECONDS
   LASTS 4 SECONDS
===================================================== */

function spawnTrap(){

    const playerId =
        1 +
        Math.floor(
            Math.random() *
            playerCount
        );


    const pos =
        randomPlayerPosition(
            playerId
        );


    const now =
        performance.now();


    traps.push({

        x:pos.x,

        y:pos.y,

        radius:22,

        area:
            playerId,

        born:now,

        expires:
            now + 4000

    });

}


/* =====================================================
   SPAWN POWER
   EVERY 60 SECONDS
===================================================== */

function spawnPower(){

    const playerId =
        1 +
        Math.floor(
            Math.random() *
            playerCount
        );


    const pos =
        randomPlayerPosition(
            playerId
        );


    const power =
        powers[
            Math.floor(
                Math.random() *
                powers.length
            )
        ];


    const now =
        performance.now();


    powerItems.push({

        x:pos.x,

        y:pos.y,

        radius:17,

        area:
            playerId,

        power,

        born:now,

        expires:
            now + 10000

    });

}


/* =====================================================
   CHARACTER MENU
===================================================== */

function buildCharacterChoices(){

    const container =
        document.getElementById(
            "playerCharacterChoices"
        );


    if (!container)
        return;


    container.innerHTML = "";


    for (
        let p = 1;
        p <= playerCount;
        p++
    ){

        const box =
            document.createElement(
                "div"
            );

        box.className =
            "player-choice";


        const title =
            document.createElement(
                "div"
            );

        title.className =
            "player-choice-title";

        title.textContent =
            "Player " +
            p +
            " Character";


        box.appendChild(title);


        const row =
            document.createElement(
                "div"
            );

        row.className =
            "character-row";


        Object.keys(
            characters
        ).forEach(
            characterId => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";

                button.className =
                    "character";


                if (
                    selectedCharacters[
                        p - 1
                    ] ===
                    characterId
                ){

                    button.classList.add(
                        "selected"
                    );

                }


                button.innerHTML =

                    `<div class="character-icon">
                        ${characters[characterId]}
                    </div>

                    <div class="character-name">
                        ${characterNames[characterId]}
                    </div>`;


                button.addEventListener(
                    "click",
                    () => {

                        selectedCharacters[
                            p - 1
                        ] =
                            characterId;


                        row
                            .querySelectorAll(
                                ".character"
                            )
                            .forEach(
                                item =>
                                    item.classList
                                        .remove(
                                            "selected"
                                        )
                            );


                        button.classList.add(
                            "selected"
                        );

                    }
                );


                row.appendChild(
                    button
                );

            }
        );


        box.appendChild(row);

        container.appendChild(box);

    }

}


/* =====================================================
   PLAYER COUNT
===================================================== */

document
    .querySelectorAll(
        "[data-players]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        "[data-players]"
                    )
                    .forEach(
                        item =>
                            item.classList
                                .remove(
                                    "selected"
                                )
                    );


                button.classList.add(
                    "selected"
                );


                playerCount =
                    Number(
                        button.dataset.players
                    );


                buildCharacterChoices();

            }
        );

    });


/* =====================================================
   TIMER OPTIONS
===================================================== */

document
    .querySelectorAll(
        "[data-time]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        "[data-time]"
                    )
                    .forEach(
                        item =>
                            item.classList
                                .remove(
                                    "selected"
                                )
                    );


                button.classList.add(
                    "selected"
                );


                gameDuration =
                    Number(
                        button.dataset.time
                    );

            }
        );

    });


/* =====================================================
   INITIAL MENU
===================================================== */

buildCharacterChoices();


/* =====================================================
   START GAME
===================================================== */

document
    .getElementById("start")
    ?.addEventListener(
        "click",
        startGame
    );


function startGame(){

    const input =
        Number(
            document
                .getElementById(
                    "winPoints"
                )
                .value
        );


    pointsToWin =
        Math.max(
            5,
            Math.min(
                500,
                input || 20
            )
        );


    gamePaused = false;


    document
        .getElementById("pauseMenu")
        .classList
        .remove("show");


    document
        .getElementById("gameOver")
        .style.display =
        "none";


    document
        .getElementById("menu")
        .style.display =
        "none";


    document
        .getElementById("game")
        .style.display =
        "block";


    const game =
        document.getElementById(
            "game"
        );


    game.classList.remove(
        "players-3",
        "players-4"
    );


    if (playerCount === 3){

        game.classList.add(
            "players-3"
        );

    }


    if (playerCount === 4){

        game.classList.add(
            "players-4"
        );

    }


    document
        .getElementById("target")
        .textContent =
        pointsToWin;


    resetGame();


    running = true;


    startTime =
        performance.now();

    lastFrame =
        performance.now();


    requestAnimationFrame(
        gameLoop
    );

}


/* =====================================================
   RESET GAME
===================================================== */

function resetGame(){

    players = [];

    coins = [];

    traps = [];

    powerItems = [];


    coinSpawnTimer = 0;

    trapSpawnTimer = 0;

    powerSpawnTimer = 0;


    const startingPositions = [];


    for (
        let i = 1;
        i <= playerCount;
        i++
    ){

        const bounds =
            getPlayerBounds(i);


        startingPositions.push({

            x:
                (
                    bounds.left +
                    bounds.right
                ) / 2,

            y:
                (
                    bounds.top +
                    bounds.bottom
                ) / 2

        });

    }


    for (
        let i = 0;
        i < playerCount;
        i++
    ){

        const characterId =
            selectedCharacters[i]
            || "robot";


        players.push({

            id:i + 1,

            x:
                startingPositions[i].x,

            y:
                startingPositions[i].y,

            radius:18,

            color:
                playerColors[i],

            icon:
                characters[
                    characterId
                ],

            character:
                characterId,

            score:0,

            baseSpeed:220,

            speed:220,

            shield:false,

            phase:false,

            activePower:null,

            powerEnd:0

        });

    }


    updateScoreboard();

}


/* =====================================================
   PLAYER UPDATE
===================================================== */

function updatePlayer(
    player,
    dt
){

    const direction =
        getDirection(
            player.id
        );


    if (
        direction.dx !== 0 ||
        direction.dy !== 0
    ){

        player.x +=
            direction.dx *
            player.speed *
            dt;


        player.y +=
            direction.dy *
            player.speed *
            dt;

    }


    keepPlayerInsideArea(
        player
    );

}


/* =====================================================
   POWER UPDATE
===================================================== */

function updatePower(
    player,
    now
){

    if (!player.activePower)
        return;


    if (
        now >=
        player.powerEnd
    ){

        player.activePower =
            null;

        player.speed =
            player.baseSpeed;

        player.phase =
            false;

    }

}


/* =====================================================
   MAGNET
===================================================== */

function updateMagnet(
    player,
    dt
){

    if (
        !player.activePower ||
        player.activePower.name !==
        "Coin Magnet"
    ){

        return;

    }


    for (
        const coin
        of coins
    ){

        const dx =
            player.x -
            coin.x;

        const dy =
            player.y -
            coin.y;

        const distance =
            Math.hypot(
                dx,
                dy
            );


        if (
            distance < 180 &&
            distance > 1
        ){

            coin.x +=
                (
                    dx /
                    distance
                ) *
                280 *
                dt;


            coin.y +=
                (
                    dy /
                    distance
                ) *
                280 *
                dt;


            const bounds =
                getPlayerBounds(
                    coin.area
                );


            coin.x =
                Math.max(
                    bounds.left + 10,
                    Math.min(
                        bounds.right - 10,
                        coin.x
                    )
                );


            coin.y =
                Math.max(
                    bounds.top + 10,
                    Math.min(
                        bounds.bottom - 10,
                        coin.y
                    )
                );

        }

    }

}


/* =====================================================
   COLLISIONS
===================================================== */

function checkCollisions(){

    for (
        const player
        of players
    ){

        /* COINS */

        for (
            let i =
                coins.length - 1;
            i >= 0;
            i--
        ){

            const coin =
                coins[i];


            const distance =
                Math.hypot(
                    player.x -
                    coin.x,

                    player.y -
                    coin.y
                );


            if (
                distance <
                player.radius +
                coin.radius
            ){

                collectCoin(
                    player,
                    coin,
                    i
                );

            }

        }


        /* TRAPS */

        for (
            let i =
                traps.length - 1;
            i >= 0;
            i--
        ){

            const trap =
                traps[i];


            const distance =
                Math.hypot(
                    player.x -
                    trap.x,

                    player.y -
                    trap.y
                );


            if (
                distance <
                player.radius +
                trap.radius
            ){

                hitTrap(
                    player,
                    trap,
                    i
                );

            }

        }


        /* POWERS */

        for (
            let i =
                powerItems.length - 1;
            i >= 0;
            i--
        ){

            const item =
                powerItems[i];


            const distance =
                Math.hypot(
                    player.x -
                    item.x,

                    player.y -
                    item.y
                );


            if (
                distance <
                player.radius +
                item.radius
            ){

                collectPower(
                    player,
                    item,
                    i
                );

            }

        }

    }

}


/* =====================================================
   COLLECT COIN
===================================================== */

function collectCoin(
    player,
    coin,
    index
){

    player.score +=
        coin.type.value;


    coins.splice(
        index,
        1
    );


    showCoinPopup(
        coin.x,
        coin.y,
        "+" +
        coin.type.value
    );


    updateScoreboard();


    if (
        player.score >=
        pointsToWin
    ){

        endGame(
            player
        );

    }

}


/* =====================================================
   SMALL SCORE POPUP
===================================================== */

function showCoinPopup(
    x,
    y,
    text
){

    const popup =
        document.createElement(
            "div"
        );


    popup.className =
        "coin-popup";


    popup.textContent =
        text;


    popup.style.left =
        x + "px";


    popup.style.top =
        y + "px";


    document.body.appendChild(
        popup
    );


    requestAnimationFrame(
        () => {

            popup.style.transform =
                "translate(-50%,-150%)";

            popup.style.opacity =
                "0";

        }
    );


    setTimeout(
        () =>
            popup.remove(),
        700
    );

}


/* =====================================================
   COLLECT POWER
===================================================== */

function collectPower(
    player,
    item,
    index
){

    const power =
        item.power;


    powerItems.splice(
        index,
        1
    );


    if (
        power.name ===
        "Coin Blast"
    ){

        traps =
            traps.filter(
                trap => {

                    const distance =
                        Math.hypot(
                            trap.x -
                            player.x,

                            trap.y -
                            player.y
                        );


                    return distance > 180;

                }
            );


        showNotice(
            "💥 Coin Blast",
            "Nearby traps destroyed!"
        );


        return;

    }


    player.activePower =
        power;


    player.powerEnd =
        performance.now() +
        power.duration;


    if (
        power.name ===
        "Speed Burst"
    ){

        player.speed =
            player.baseSpeed *
            1.9;

    }


    if (
        power.name ===
        "Shield"
    ){

        player.shield =
            true;

    }


    if (
        power.name ===
        "Phase"
    ){

        player.phase =
            true;

    }


    showNotice(
        power.icon +
        " " +
        power.name,

        "Power activated!"
    );

}


/* =====================================================
   TRAP HIT
===================================================== */

function hitTrap(
    player,
    trap,
    index
){

    if (player.phase){

        traps.splice(
            index,
            1
        );

        return;

    }


    if (player.shield){

        player.shield =
            false;


        traps.splice(
            index,
            1
        );


        showNotice(
            "🛡️ Shield",
            "Trap blocked!"
        );


        return;

    }


    player.score =
        Math.max(
            0,
            player.score - 2
        );


    traps.splice(
        index,
        1
    );


    showNotice(
        "⚠️ Trap",
        "-2 points"
    );


    updateScoreboard();

}


/* =====================================================
   NOTICE
===================================================== */

function showNotice(
    title,
    text
){

    const notice =
        document.getElementById(
            "notice"
        );


    if (!notice)
        return;


    notice.innerHTML =
        `<strong>${title}</strong> ${text}`;


    notice.classList.remove(
        "show"
    );


    void notice.offsetWidth;


    notice.classList.add(
        "show"
    );


    clearTimeout(
        noticeTimer
    );


    noticeTimer =
        setTimeout(
            () => {

                notice.classList.remove(
                    "show"
                );

            },
            1000
        );

}


/* =====================================================
   SCOREBOARD
===================================================== */

function updateScoreboard(){

    if (!players.length)
        return;


    const p1 =
        document.getElementById(
            "player1Score"
        );


    const p2 =
        document.getElementById(
            "player2Score"
        );


    const extra =
        document.getElementById(
            "extraScores"
        );


    if (
        p1 &&
        players[0]
    ){

        p1.innerHTML =
            createScoreHTML(
                players[0]
            );

    }


    if (
        p2 &&
        players[1]
    ){

        p2.innerHTML =
            createScoreHTML(
                players[1]
            );

    }


    if (extra){

        extra.innerHTML = "";


        for (
            let i = 2;
            i < players.length;
            i++
        ){

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "extra-score";


            div.style.setProperty(
                "--player-color",
                players[i].color
            );


            div.textContent =
                "P" +
                players[i].id +
                ": " +
                players[i].score +
                "/" +
                pointsToWin;


            extra.appendChild(
                div
            );

        }

    }

}


function createScoreHTML(
    player
){

    return `

        <div
            class="player-score"
            style="--player-color:${player.color}"
        >

            P${player.id}:
            ${player.score}/${pointsToWin}

        </div>

    `;

}


/* =====================================================
   REMOVE EXPIRED OBJECTS
===================================================== */

function cleanObjects(now){

    coins =
        coins.filter(
            coin =>
                now <
                coin.expires
        );


    traps =
        traps.filter(
            trap =>
                now <
                trap.expires
        );


    powerItems =
        powerItems.filter(
            item =>
                now <
                item.expires
        );

}


/* =====================================================
   BACKGROUND
===================================================== */

function drawBackground(){

    ctx.fillStyle =
        "#101322";


    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    ctx.strokeStyle =
        "rgba(255,255,255,.035)";


    ctx.lineWidth = 1;


    const grid = 40;


    for (
        let x = 0;
        x < width;
        x += grid
    ){

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y < height;
        y += grid
    ){

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();

    }

}


/* =====================================================
   DRAW BOUNDARIES
===================================================== */

function drawPlayerBoundaries(){

    ctx.save();


    ctx.setLineDash([
        8,
        7
    ]);


    ctx.lineWidth = 2;


    for (
        let i = 1;
        i <= playerCount;
        i++
    ){

        const bounds =
            getPlayerBounds(i);


        ctx.strokeStyle =
            playerColors[
                i - 1
            ];


        ctx.globalAlpha =
            .32;


        ctx.strokeRect(

            bounds.left,

            bounds.top,

            bounds.right -
            bounds.left,

            bounds.bottom -
            bounds.top

        );

    }


    ctx.setLineDash([]);

    ctx.globalAlpha = 1;

    ctx.restore();

}


/* =====================================================
   DRAW COIN
===================================================== */

function drawCoin(
    coin,
    now
){

    const pulse =
        Math.sin(
            now / 130 +
            coin.pulse
        ) * 2;


    ctx.save();


    ctx.shadowColor =
        coin.type.glow;


    ctx.shadowBlur =
        14;


    ctx.fillStyle =
        coin.type.color;


    ctx.beginPath();


    ctx.arc(
        coin.x,
        coin.y,
        coin.radius +
            pulse,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.shadowBlur = 0;


    ctx.strokeStyle =
        "rgba(255,255,255,.7)";


    ctx.lineWidth = 2;


    ctx.stroke();


    ctx.fillStyle =
        "#111";


    ctx.font =
        "bold 11px Arial";


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "middle";


    ctx.fillText(
        coin.type.value,
        coin.x,
        coin.y
    );


    ctx.restore();

}


/* =====================================================
   DRAW TRAP
===================================================== */

function drawTrap(trap){

    ctx.save();


    ctx.translate(
        trap.x,
        trap.y
    );


    ctx.shadowColor =
        "#ff0000";


    ctx.shadowBlur =
        12;


    ctx.fillStyle =
        "#e03131";


    ctx.beginPath();


    for (
        let i = 0;
        i < 8;
        i++
    ){

        const angle =
            i *
            Math.PI *
            2 /
            8;


        const radius =
            i % 2 === 0
                ? 23
                : 11;


        const x =
            Math.cos(angle) *
            radius;


        const y =
            Math.sin(angle) *
            radius;


        if (i === 0){

            ctx.moveTo(
                x,
                y
            );

        }else{

            ctx.lineTo(
                x,
                y
            );

        }

    }


    ctx.closePath();

    ctx.fill();


    ctx.shadowBlur = 0;


    ctx.fillStyle =
        "#fff";


    ctx.font =
        "bold 13px Arial";


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "middle";


    ctx.fillText(
        "!",
        0,
        0
    );


    ctx.restore();

}


/* =====================================================
   DRAW POWER
===================================================== */

function drawPower(
    item,
    now
){

    const pulse =
        Math.sin(
            now / 150
        ) * 4;


    ctx.save();


    ctx.shadowColor =
        item.power.color;


    ctx.shadowBlur =
        18;


    ctx.fillStyle =
        item.power.color;


    ctx.beginPath();


    ctx.arc(
        item.x,
        item.y,
        item.radius +
            pulse,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.shadowBlur = 0;


    ctx.fillStyle =
        "#111";


    ctx.font =
        "21px Arial";


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "middle";


    ctx.fillText(
        item.power.icon,
        item.x,
        item.y
    );


    ctx.restore();

}


/* =====================================================
   DRAW PLAYER
===================================================== */

function drawPlayer(
    player
){

    ctx.save();


    if (player.shield){

        ctx.strokeStyle =
            "#74c0fc";


        ctx.lineWidth = 4;


        ctx.shadowColor =
            "#74c0fc";


        ctx.shadowBlur =
            15;


        ctx.beginPath();


        ctx.arc(
            player.x,
            player.y,
            player.radius + 8,
            0,
            Math.PI * 2
        );


        ctx.stroke();

    }


    if (player.phase){

        ctx.globalAlpha =
            .5;

    }


    ctx.fillStyle =
        player.color;


    ctx.shadowColor =
        player.color;


    ctx.shadowBlur =
        14;


    ctx.beginPath();


    ctx.arc(
        player.x,
        player.y,
        player.radius,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1;


    ctx.font =
        "22px Arial";


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "middle";


    ctx.fillText(
        player.icon,
        player.x,
        player.y
    );


    ctx.fillStyle =
        "#fff";


    ctx.font =
        "bold 9px Arial";


    ctx.fillText(
        "P" +
        player.id,

        player.x,

        player.y + 29
    );


    ctx.restore();

}


/* =====================================================
   DRAW EVERYTHING
===================================================== */

function draw(now){

    drawBackground();

    drawPlayerBoundaries();


    for (
        const coin
        of coins
    ){

        drawCoin(
            coin,
            now
        );

    }


    for (
        const trap
        of traps
    ){

        drawTrap(
            trap
        );

    }


    for (
        const item
        of powerItems
    ){

        drawPower(
            item,
            now
        );

    }


    for (
        const player
        of players
    ){

        drawPlayer(
            player
        );

    }

}


/* =====================================================
   TIMER
===================================================== */

function updateTimer(now){

    const elapsed =
        (
            now -
            startTime
        ) / 1000;


    const remaining =
        Math.max(
            0,
            gameDuration -
            elapsed
        );


    const minutes =
        Math.floor(
            remaining / 60
        );


    const seconds =
        Math.floor(
            remaining % 60
        );


    const timer =
        document.getElementById(
            "timer"
        );


    if (timer){

        timer.textContent =
            minutes +
            ":" +
            String(seconds)
                .padStart(
                    2,
                    "0"
                );

    }


    if (
        remaining <= 0
    ){

        finishByScore();

    }

}


/* =====================================================
   FINISH BY SCORE
===================================================== */

function finishByScore(){

    if (!running)
        return;


    let winner =
        players[0];


    for (
        const player
        of players
    ){

        if (
            player.score >
            winner.score
        ){

            winner =
                player;

        }

    }


    endGame(
        winner
    );

}


/* =====================================================
   END GAME
===================================================== */

function endGame(
    winner
){

    if (!running)
        return;


    running = false;

    gamePaused = false;


    document
        .getElementById(
            "pauseMenu"
        )
        .classList
        .remove("show");


    const winnerText =
        document.getElementById(
            "winnerText"
        );


    const winnerIcon =
        document.getElementById(
            "winnerIcon"
        );


    const finalScores =
        document.getElementById(
            "finalScores"
        );


    if (winnerText){

        winnerText.textContent =
            "Player " +
            winner.id +
            " Wins!";

    }


    if (winnerIcon){

        winnerIcon.textContent =
            winner.icon;

    }


    if (finalScores){

        finalScores.innerHTML =
            "";


        const sorted =
            [...players].sort(
                (a,b) =>
                    b.score -
                    a.score
            );


        sorted.forEach(
            (player,index) => {

                const line =
                    document.createElement(
                        "div"
                    );


                line.innerHTML =

                    (
                        index === 0
                            ? "🏆 "
                            : ""
                    ) +

                    "Player " +
                    player.id +
                    ": <strong>" +
                    player.score +
                    "</strong>";


                finalScores.appendChild(
                    line
                );

            }
        );

    }


    document
        .getElementById(
            "gameOver"
        )
        .style.display =
        "flex";

}


/* =====================================================
   PAUSE SYSTEM
===================================================== */

const pauseButton =
    document.getElementById(
        "pauseButton"
    );


const pauseMenu =
    document.getElementById(
        "pauseMenu"
    );


const resumeButton =
    document.getElementById(
        "resumeButton"
    );


const restartGameButton =
    document.getElementById(
        "restartGameButton"
    );


const quitButton =
    document.getElementById(
        "quitButton"
    );


/* =====================================================
   TOGGLE PAUSE
===================================================== */

function togglePause(){

    if (!running)
        return;


    if (gamePaused){

        resumeGame();

    }else{

        pauseGame();

    }

}


/* =====================================================
   PAUSE
===================================================== */

function pauseGame(){

    if (
        !running ||
        gamePaused
    ){

        return;

    }


    gamePaused = true;


    pausedAt =
        performance.now();


    pauseMenu.classList.add(
        "show"
    );


    Object.keys(
        controls
    ).forEach(
        id => {

            controls[id].up = false;
            controls[id].down = false;
            controls[id].left = false;
            controls[id].right = false;

        }
    );

}


/* =====================================================
   RESUME
===================================================== */

function resumeGame(){

    if (
        !running ||
        !gamePaused
    ){

        return;

    }


    const now =
        performance.now();


    const pausedTime =
        now -
        pausedAt;


    /*
       Move startTime forward so the
       timer does not count paused time.
    */

    startTime +=
        pausedTime;


    /*
       Move all object expiration
       times forward too.
    */

    coins.forEach(
        coin => {

            coin.expires +=
                pausedTime;

        }
    );


    traps.forEach(
        trap => {

            trap.expires +=
                pausedTime;

        }
    );


    powerItems.forEach(
        item => {

            item.expires +=
                pausedTime;

        }
    );


    players.forEach(
        player => {

            if (
                player.powerEnd
            ){

                player.powerEnd +=
                    pausedTime;

            }

        }
    );


    gamePaused = false;


    pauseMenu.classList.remove(
        "show"
    );


    lastFrame =
        now;

}


/* =====================================================
   PAUSE BUTTON
===================================================== */

pauseButton?.addEventListener(
    "click",
    togglePause
);


/* =====================================================
   RESUME BUTTON
===================================================== */

resumeButton?.addEventListener(
    "click",
    resumeGame
);


/* =====================================================
   RESTART CURRENT MATCH
===================================================== */

restartGameButton?.addEventListener(
    "click",
    restartCurrentGame
);


function restartCurrentGame(){

    running = false;

    gamePaused = false;


    pauseMenu.classList.remove(
        "show"
    );


    document
        .getElementById(
            "gameOver"
        )
        .style.display =
        "none";


    /*
       Same settings are kept:
       - player count
       - characters
       - points
       - timer
    */

    resetGame();


    running = true;


    startTime =
        performance.now();


    lastFrame =
        performance.now();


    document
        .getElementById(
            "target"
        )
        .textContent =
        pointsToWin;


    requestAnimationFrame(
        gameLoop
    );

}


/* =====================================================
   QUIT GAME
===================================================== */

quitButton?.addEventListener(
    "click",
    quitGame
);


function quitGame(){

    running = false;

    gamePaused = false;


    pauseMenu.classList.remove(
        "show"
    );


    document
        .getElementById(
            "game"
        )
        .style.display =
        "none";


    document
        .getElementById(
            "gameOver"
        )
        .style.display =
        "none";


    document
        .getElementById(
            "menu"
        )
        .style.display =
        "flex";


    players = [];

    coins = [];

    traps = [];

    powerItems = [];


    coinSpawnTimer = 0;

    trapSpawnTimer = 0;

    powerSpawnTimer = 0;


    Object.keys(
        controls
    ).forEach(
        id => {

            controls[id].up = false;
            controls[id].down = false;
            controls[id].left = false;
            controls[id].right = false;

        }
    );


    Object.keys(
        keys
    ).forEach(
        key => {

            keys[key] = false;

        }
    );


    buildCharacterChoices();

}


/* =====================================================
   GAME OVER PLAY AGAIN
===================================================== */

document
    .getElementById(
        "restartButton"
    )
    ?.addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "gameOver"
                )
                .style.display =
                "none";


            startGame();

        }
    );


/* =====================================================
   GAME LOOP
===================================================== */

function gameLoop(now){

    if (!running)
        return;


    /*
       IMPORTANT:
       When paused, the loop continues
       rendering but does NOT update the
       game simulation.
    */

    if (gamePaused){

        lastFrame =
            now;


        requestAnimationFrame(
            gameLoop
        );


        return;

    }


    const dt =
        Math.min(
            0.033,
            (
                now -
                lastFrame
            ) / 1000
        );


    lastFrame =
        now;


    /* COINS */

    coinSpawnTimer +=
        dt;


    if (
        coinSpawnTimer >= 2
    ){

        coinSpawnTimer -= 2;

        spawnCoin();

    }


    /* TRAPS */

    trapSpawnTimer +=
        dt;


    if (
        trapSpawnTimer >= 30
    ){

        trapSpawnTimer -= 30;

        spawnTrap();


        showNotice(
            "⚠️ TRAP",
            "A trap appeared!"
        );

    }


    /* POWERS */

    powerSpawnTimer +=
        dt;


    if (
        powerSpawnTimer >= 60
    ){

        powerSpawnTimer -= 60;

        spawnPower();


        showNotice(
            "⚡ POWER",
            "Random power appeared!"
        );

    }


    /* PLAYERS */

    for (
        const player
        of players
    ){

        updatePlayer(
            player,
            dt
        );


        updatePower(
            player,
            now
        );


        updateMagnet(
            player,
            dt
        );

    }


    /* COLLISIONS */

    checkCollisions();


    /* REMOVE EXPIRED */

    cleanObjects(
        now
    );


    /* TIMER */

    updateTimer(
        now
    );


    /* DRAW */

    draw(
        now
    );


    requestAnimationFrame(
        gameLoop
    );

}


/* =====================================================
   PREVENT MOBILE PAGE SCROLL
===================================================== */

document.addEventListener(
    "touchmove",
    event => {

        if (
            running
        ){

            event.preventDefault();

        }

    },
    {
        passive:false
    }
);