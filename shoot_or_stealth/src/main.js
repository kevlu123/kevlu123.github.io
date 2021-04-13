
class GameState
{
    // Title screen
    static MENU = 0;
    // Main gameplay
    static GAMEPLAY = 1;
    // Waiting for level to load
    static WAITING = 2;
    // Wait for player to press restart
    static WAIT_FOR_RESTART = 3;
    // Wait for player to press next level
    static WAIT_FOR_NEXT_LEVEL = 4;
}


// Global variables
let input = new Input();
let canvas = null;
let gfx = null;
let time = 0;
let startupTime = Date.now();
let realTime = Date.now();
let deltaTime = FRAME_DURATION;
let gameState = GameState.MENU;
let levelIndex = 0;
let stealthing = true;
let level = null;

// Sprite groups
let levelTiles = new TileSpriteList();
let updatableTiles = new SpriteList();
let players = new SpriteList();
let livingPlayers = new SpriteList();
let enemies = new SpriteList();
let bullets = new SpriteList();
let entities = new SpriteList();
let endTiles = new SpriteList();
let ladders = new SpriteList();
let backgroundTiles = new SpriteList();

// UI sprites
let titleScreen = null;
let watermark = null;
let fadeOverlay = null;
let gameoverScreen = null;
let nextLevelScreen = null;
let stealthedScreen = null;
let winScreen = null;

let healthbar = null;
let healthbarContent = null;
let grenadeCountSprite = null;
let healthbarP2 = null;
let healthbarContentP2 = null;
let grenadeCountSpriteP2 = null;


function isFirstLevel()
{
    return levelIndex === 0;
}

function isLastLevel()
{
    return levelIndex + 1 === LEVELS.length;
}

function onEnemyTriggered()
{
    stealthing = false;
}

function loadUI()
{
    function createUI(filename, visible=true)
    {
        let sprite = new UISprite(new ImageView(
            filename
        ));
        if (!visible)
            sprite.alpha = 0;
        sprite.size = 0.9;
        return sprite;
    }

    // Title
    titleScreen = createUI(TITLESCREEN_FILENAME);

    // Watermark
    watermark = new UISprite(new ImageView(
        WATERMARK_FILENAME
    ));
    watermark.size = 0.3;
    watermark.pivotX = 1;
    watermark.pivotY = 0;
    watermark.x = (w, h) => w;
    watermark.y = (w, h) => 0;

    // Fading screen
    fadeOverlay = new UISprite(ImageView.fromAtlas(
        SOLIDCOLOURS_ATLAS_FILENAME,
        SolidColourAtlasIndex.FADE_SCREEN
    ));
    fadeOverlay.alpha = 0;
    fadeOverlay.size = 10;
    
    // Health bar
    healthbar = new UISprite(new ImageView(
        HEALTHBAR_FILENAME
    ));
    healthbar.x = (w, h) => h * 0.01;
    healthbar.y = (w, h) => h * 0.01;
    healthbar.pivotX = 0;
    healthbar.pivotY = 0;
    healthbar.scalingType = UIScaling.WIDTH;
    healthbar.size = 0.35;

    // Green part of health bar
    healthbarContent = new UISprite(ImageView.fromAtlas(
        SOLIDCOLOURS_ATLAS_FILENAME,
        SolidColourAtlasIndex.HEALTH
    ));
    healthbarContent.x = (w, h) => h * 0.01;
    healthbarContent.y = (w, h) => h * 0.01;
    healthbarContent.pivotX = 0;
    healthbarContent.pivotY = 0;
    healthbarContent.scalingType = UIScaling.CUSTOM;
    healthbarContent.size = [
        (w, h) => 0.35 * w * players.get(0).getHealthPercentage(),
        (w, h) => 0.35 / healthbar.getAspectRatio() * w
    ];
    
    // P2 health bar
    healthbarP2 = new UISprite(new ImageView(
        HEALTHBAR_FILENAME
    ));
    healthbarP2.x = (w, h) => w - h * 0.01;
    healthbarP2.y = (w, h) => h * 0.01;
    healthbarP2.pivotX = 1;
    healthbarP2.pivotY = 0;
    healthbarP2.scalingType = UIScaling.WIDTH;
    healthbarP2.size = 0.35;

    // Green part of P2 health bar
    healthbarContentP2 = new UISprite(ImageView.fromAtlas(
        SOLIDCOLOURS_ATLAS_FILENAME,
        SolidColourAtlasIndex.HEALTH
    ));
    healthbarContentP2.x = (w, h) => w - h * 0.01;
    healthbarContentP2.y = (w, h) => h * 0.01;
    healthbarContentP2.pivotX = 1;
    healthbarContentP2.pivotY = 0;
    healthbarContentP2.scalingType = UIScaling.CUSTOM;
    healthbarContentP2.size = [
        (w, h) => 0.35 * w * players.get(1).getHealthPercentage(),
        (w, h) => 0.35 / healthbar.getAspectRatio() * w
    ];

    // Grenade count
    grenadeCountSprite = new UISprite(ImageView.fromAtlas(
        OBJECT_ATLAS_FILENAME,
        ObjectAtlasIndex.GRENADE_BULLET,
        0,
        0,
        8,
        10
    ));
    grenadeCountSprite.pivotY = 0;
    grenadeCountSprite.scalingType = UIScaling.WIDTH;
    grenadeCountSprite.size = healthbar.size / 20;

    gameoverScreen = createUI(GAMEOVER_FILENAME, false);
    nextLevelScreen = createUI(NEXTLEVEL_FILENAME, false);
    stealthedScreen = createUI(STEALTHED_FILENAME, false);
    winScreen = createUI(WINSCREEN_FILENAME, false);
}

function reloadLevel()
{
    loadLevel(levelIndex);
    gameState = GameState.GAMEPLAY;
}

function loadNextLevel()
{
    if (levelIndex + 1 < LEVELS.length)
    {
        levelIndex++;
        
        if (isLastLevel())
            winScreen.alpha = 1;

        loadLevel(levelIndex);
        gameState = GameState.GAMEPLAY;
    }
}

function loadLevel(index)
{
    let levelData = LEVELS[index];

    // Destroy sprites from previous level
    levelTiles = new TileSpriteList();
    updatableTiles .forEach(sprite => sprite.destroy());
    enemies        .forEach(sprite => sprite.destroy());
    bullets        .forEach(sprite => sprite.destroy());
    entities       .forEach(sprite => sprite.destroy());
    endTiles       .forEach(sprite => sprite.destroy());
    ladders        .forEach(sprite => sprite.destroy());
    backgroundTiles.forEach(sprite => sprite.destroy());

    // Load level data
    level = new Level(levelData);

    // Set player position
    for (let player of players)
    {
        player.x = TILE_SIZE * level.getStartPos()[0];
        player.y = TILE_SIZE * level.getStartPos()[1];
        player.revive();
    }

    // Reset camera targets
    livingPlayers.clear();
    livingPlayers.push(...players);
    
    // Clamp camera
    gfx.minX = TILE_SIZE;
    gfx.minY = 0;
    gfx.maxX = TILE_SIZE * (level.getWidth() - 1);

    // Register end tiles
    endTiles.push(...level.getEndTiles());

    // Hide UI screens
    gameoverScreen.alpha = 0;
    nextLevelScreen.alpha = 0;
    stealthedScreen.alpha = 0;

    // Reset stealthing state
    stealthing = true;
}

function drawLevel()
{
    gfx.drawBackground(BACKGROUND_COLOUR);

    for (let tile of backgroundTiles)
        gfx.drawSprite(tile);

    // Blow up tiles
    let dist = Math.floor(Math.max(gfx.width(), gfx.height()) / PIXEL_SIZE / 2 + TILE_SIZE);
    for (let tile of getNearbyTiles(gfx.x, gfx.y, dist))
        gfx.drawSprite(tile);

    for (let ladder of ladders)
        gfx.drawSprite(ladder);

    for (let enemy of enemies)
        gfx.drawSprite(enemy);

    for (let player of players)
        gfx.drawSprite(player);

    for (let entity of entities)
        gfx.drawSprite(entity);

    for (let bullet of bullets)
        gfx.drawSprite(bullet);

    for (let particle of Particle.getSprites())
        gfx.drawSprite(particle);
}

function drawUI()
{
    fadeOverlay.sizeIsWidth = gfx.width() > gfx.height();

    gfx.drawUISprite(healthbar);
    gfx.drawUISprite(healthbarContent);
    if (players.length === 2)
    {
        gfx.drawUISprite(healthbarP2);
        gfx.drawUISprite(healthbarContentP2);
    }

    grenadeCountSprite.pivotX = 0;
    grenadeCountSprite.y = (w, h) => 0.02 * h + healthbar.rawHeight;
    for (let i = 0; i < players.get(0).getGrenadeCount(); i++)
    {
        grenadeCountSprite.x = (w, h) => 0.01 * h + grenadeCountSprite.rawWidth * i;
        gfx.drawUISprite(grenadeCountSprite);
    }

    if (players.length === 2)
    {
        grenadeCountSprite.pivotX = 1;
        grenadeCountSprite.y = (w, h) => 0.02 * h + healthbar.rawHeight;
        for (let i = 0; i < players.get(1).getGrenadeCount(); i++)
        {
            grenadeCountSprite.x = (w, h) => w - (0.01 * h + grenadeCountSprite.rawWidth * i);
            gfx.drawUISprite(grenadeCountSprite);
        }
    }

    if (levelIndex === 0)
    {
        let p1 = players.get(0);
        let dist = distance(
            PLAYER_START_X,
            PLAYER_START_Y,
            p1.x,
            p1.y
        );
        let alpha = clamp(1 - dist / TITLE_FADE_DISTANCE, 0, 1);
        titleScreen.alpha = alpha;
        watermark.alpha = alpha;
        gfx.drawUISprite(titleScreen);
        gfx.drawUISprite(watermark);
    }

    gfx.drawUISprite(gameoverScreen);
    gfx.drawUISprite(nextLevelScreen);
    gfx.drawUISprite(stealthedScreen);
    gfx.drawUISprite(winScreen);
    gfx.drawUISprite(fadeOverlay);
}

function addPlayer2()
{
    let p1 = players.get(0);

    let player = new Player(1);
    player.x = p1.x;
    player.y = p1.y;
    players.push(player);
    livingPlayers.push(player);
}

function controlPlayer()
{
    let p1 = players.get(0);

    if (input.getKey(Key.LEFT))
        p1.moveLeft();
    if (input.getKey(Key.RIGHT))
        p1.moveRight();
    if (input.getKey(Key.DOWN))
        p1.moveDown();
    if (input.getKey(Key.UP))
        p1.moveUp();
    if (input.getKeyDown(Key.JUMP) || input.getKeyDown(Key.UP) && !p1.checkCollisionWithSprites(ladders))
        p1.jump();
    if (input.getKey(Key.SHOOT))
        p1.shoot();
    if (input.getKeyDown(Key.GRENADE))
        p1.throwGrenade();

    if (players.length === 2)
    {
        let p2 = players.get(1);

        if (input.getKey(Key.P2_LEFT))
            p2.moveLeft();
        if (input.getKey(Key.P2_RIGHT))
            p2.moveRight();
        if (input.getKey(Key.P2_DOWN))
            p2.moveDown();
        if (input.getKey(Key.P2_UP))
            p2.moveUp();
        if (input.getKeyDown(Key.P2_JUMP) || input.getKeyDown(Key.P2_UP) && !p2.checkCollisionWithSprites(ladders))
            p2.jump();
        if (input.getKey(Key.P2_SHOOT))
            p2.shoot();
        if (input.getKeyDown(Key.P2_GRENADE))
            p2.throwGrenade();
    }

    if (players.length === 1 && input.getKeyDown(Key.P2_SHOOT))
        addPlayer2();
}

// Update function for menu
function updateMenu()
{
    controlPlayer();

    // Close menu and start game
    let startGame = false;
    if (input.getKeyDown(Key.LEFT) || input.getKeyDown(Key.RIGHT))
        startGame = true;
    if (players.length === 2 && (input.getKeyDown(Key.P2_LEFT) || input.getKeyDown(Key.P2_RIGHT)))
        startGame = true;

    if (startGame)
    {
        gameState = GameState.GAMEPLAY;
        
        // Start background music
        Timer.addTimer(0.5, () => AudioPlayer.playLooped(MUSIC_FILENAME));

        Animator.interpolate(
            titleScreen,
            "alpha",
            1,
            0,
            1
        );
        
        Animator.interpolate(
            watermark,
            "alpha",
            1,
            0,
            1
        );
    }
}

//  Update function for gameplay
function updateGameplay()
{
    controlPlayer();

    // Check win. Player must stand on end tile
    if (!isLastLevel() && players.some(
            player => player.getGroundedOn().filter(
                sprite => endTiles.includes(sprite)
            ).length > 0
        ))
    {
        win();
    }

    // Check lose
    if (players.every(player => player.isDead()))
        lose();
}

// Update function for waiting to reload the level
function updateWaitForRestart()
{
    if (input.getAnyKeyDown())
    {
        gameState = GameState.WAITING;
        fadeScreen(1, true);
        Timer.addTimer(1.1, () => {
            reloadLevel();
            fadeScreen(1, false);
        });
    }
}

// Update function for waiting to load the next level
function updateWaitForNextLevel()
{
    if (input.getAnyKeyDown())
    {
        gameState = GameState.WAITING;
        fadeScreen(1, true);
        Timer.addTimer(1.1, () => {
            loadNextLevel();
            fadeScreen(1, false);
        });
    }
}

// Logs a message to the console if lag is detected
function checkForLag()
{
    let curTime = (realTime - startupTime) / 1000;
    if (deltaTime > 1.25 * FRAME_DURATION)
        console.log(`[${curTime}s] Lagging! Frame took ${deltaTime}s.`);
}

// Update function
function onUpdate()
{
    // Update ggame time
    time += FRAME_DURATION;

    // Update real time
    let now = Date.now();
    deltaTime = (now - realTime) / 1000;
    realTime = now;
    
    // Call a more specific update function
    switch (gameState)
    {
        case GameState.MENU:                updateMenu();             break;
        case GameState.GAMEPLAY:            updateGameplay();         break;
        case GameState.WAIT_FOR_RESTART:    updateWaitForRestart();   break;
        case GameState.WAIT_FOR_NEXT_LEVEL: updateWaitForNextLevel(); break;
    }

    // Check for lag
    if (gameState != GameState.MENU && gameState != GameState.WAITING)
        checkForLag();
    
    // Update camera targets
    if (livingPlayers.length === 2)
    {
        let p1 = players.get(0);
        let p2 = players.get(1);

        if (p1.isDead())
            livingPlayers.remove(p1);
        else if (p2.isDead())
            livingPlayers.remove(p2);
    }

    // Update camera position and draw frame
    gfx.update();
    drawLevel();
    drawUI();

    // Update animator and timers
    Animator.update();
    Timer.update();

    // Update sprites
    for (let player of players)
        player.update();
    for (let bullet of bullets)
        bullet.update();
    for (let enemy of enemies)
        enemy.update();
    for (let entity of entities)
        entity.update();
    for (let tile of updatableTiles)
        tile.update();
    Particle.update();

    // Update input
    input.update();
}

// Gets tiles within a square radius. Parameters are in world coordinates
function* getNearbyTiles(x, y, dist)
{
    x = Math.floor(x / TILE_SIZE);
    y = Math.floor(y / TILE_SIZE);
    dist = Math.floor(dist / TILE_SIZE);
    for (let b = y - dist; b <= y + dist; b++)
        for (let a = x - dist; a <= x + dist; a++)
        {
            let tile = levelTiles.get(a, b);
            if (tile !== null)
                yield tile;
        }
}

function createExplosion(x, y)
{
    // Create particles and shake the screen
    ExplosionBurstParticle.create(x, y);
    gfx.shake();

    function checkExplosion(sprite)
    {
        if (sprite.isNearExplosion(x, y))
            sprite.onExplosion(x, y);
    };

    // Blow up tiles
    for (let tile of getNearbyTiles(x, y, EXPLOSION_RADIUS + TILE_SIZE))
        checkExplosion(tile);
    
    // Hurt enemies and players
    enemies.forEach(checkExplosion);
    players.forEach(checkExplosion);

    // Check entities
    entities.forEach(checkExplosion);

    AudioPlayer.play(EXPLOSION_SOUND_FILENAME);
}

// Win event
function win()
{
    gameState = GameState.WAITING;
    
    // Run animation
    Timer.addTimer(1, () =>
    {
        Animator.interpolate(
            stealthing ? stealthedScreen : nextLevelScreen,
            "alpha",
            0,
            1,
            1
        );
        gameState = GameState.WAIT_FOR_NEXT_LEVEL;
    });
}

// Lose event
function lose()
{
    gameState = GameState.WAITING;

    // Run animation
    Timer.addTimer(1, () =>
    {
        Animator.interpolate(
            gameoverScreen,
            "alpha",
            0,
            1,
            1
        );
        gameState = GameState.WAIT_FOR_RESTART;
    });
}

function fadeScreen(duration, fadeIn)
{
    Animator.interpolate(
        fadeOverlay,
        "alpha",
        fadeIn ? 0 : 1,
        fadeIn ? 1 : 0,
        duration
    );
}

// Resize canvas when window resizes
function onWindowResize()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Entry point
function main()
{
    // Create graphics
    canvas = document.getElementById("canvas");
    gfx = new Graphics(canvas);
    gfx.targets = livingPlayers;

    function onImagesLoaded()
    {
        // Create player
        players.push(new Player());

        loadUI();

        // Load first level
        levelIndex = 0;
        loadLevel(levelIndex);

        // Register update function
        onWindowResize();
        setInterval(onUpdate, FRAME_DURATION * 1000);
    }

    // Load images before calling code that requires image size to be known
    ImageLoader.loadImages(
        [
            CHARACTER_ATLAS_FILENAME,
            TILE_ATLAS_FILENAME,
            OBJECT_ATLAS_FILENAME,
            TITLESCREEN_FILENAME,
            WATERMARK_FILENAME,
            GAMEOVER_FILENAME,
            NEXTLEVEL_FILENAME,
            STEALTHED_FILENAME,
            WINSCREEN_FILENAME,
            SOLIDCOLOURS_ATLAS_FILENAME,
            HEALTHBAR_FILENAME,
        ],
        onImagesLoaded
    );
}

// Register callbacks
window.onload = main;
window.onresize = onWindowResize;
