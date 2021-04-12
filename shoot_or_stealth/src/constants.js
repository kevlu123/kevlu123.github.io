
// Files
const CHARACTER_ATLAS_FILENAME = "img/characters.png";
const TILE_ATLAS_FILENAME = "img/tiles.png";
const OBJECT_ATLAS_FILENAME = "img/objects.png";
const TITLESCREEN_FILENAME = "img/title.png";
const WATERMARK_FILENAME = "img/watermark.png";
const GAMEOVER_FILENAME = "img/gameover.png";
const NEXTLEVEL_FILENAME = "img/nextlevel.png";
const STEALTHED_FILENAME = "img/stealthed.png";
const WINSCREEN_FILENAME = "img/winscreen.png";
const HEALTHBAR_FILENAME = "img/healthbar.png";
const SOLIDCOLOURS_ATLAS_FILENAME = "img/solidcolours.png";

// Bullet properties (where applicable)
const BULLET_ANGULAR_VELOCITY = -0.3;
const BULLET_ANGULAR_DAMPING = 0.98;
const BULLET_COLLISION_DAMPING = 0.95;
const BULLET_ROTATION_COLLISION_DAMPING = 0.95;
const BULLET_SPAWN_OFFSET_Y = 6;
const BULLET_SPAWN_DISTANCE_THRESHOLD = 32;

// Explosions
const EXPLOSION_DAMAGE = 25;
const EXPLOSION_FORCE = 5;
const EXPLOSION_RADIUS = 80;
const SCREEN_SHAKE_FREQUENCY = 10;
const SCREEN_SHAKE_AMPLITUDE = 3;
const SCREEN_SHAKE_DURATION = 0.15;
const BOMB_EXPLOSION_DELAY = 0.5;

// Character properties
const PLAYER_DAMPING_X = 0.9;
const PLAYER_DAMPING_X_LADDER = 0.7;
const PLAYER_WALK_SPEED = 0.5;
const ENEMY_DAMPING_X = 0.8;
const ENEMY_WALK_SPEED = 0.4;
const JUMP_VELOCITY = 8;
const PLAYER_HP = 10;
const ENEMY_HP = 3;
const DIE_VELOCITY_X = 3;
const DIE_VELOCITY_Y = 4.5;
const DIE_DAMPING_X = 0.96;
const TERMINAL_VELOCITY = 16;
const LADDER_SPEED_Y = 1;
const MAX_GRENADES = 5;
const CHARACTER_WALK_ANIMATION_FRAMES = 2;
const CHARACTER_WALK_ANIMATION_FRAME_DURATION = 0.1;
const OVERKILL_HP = -8;

// Enemy AI
const ENEMY_WALK_INTERVAL_MIN = 0.5;
const ENEMY_WALK_INTERVAL_MAX = 3;
const ENEMY_WALK_DURATION_MIN = 0.3;
const ENEMY_WALK_DURATION_MAX = 0.7;
const ENEMY_SHOOT_INTERVAL_MIN = 0.5;
const ENEMY_SHOOT_INTERVAL_MAX = 3;
const ENEMY_SHOOT_DURATION_MIN = 0.3;
const ENEMY_SHOOT_DURATION_MAX = 0.7;
const ENEMY_RAYCAST_DIR_X = Math.cos(Math.PI / 3);
const ENEMY_RAYCAST_DIR_Y = Math.sin(Math.PI / 3);

// Particles
const BLOOD_PARTICLE_COUNT = 5;
const BLOOD_PARTICLE_MAX_VEL = 3;
const BLOOD_PARTICLE_MIN_SIZE = 1;
const BLOOD_PARTICLE_MAX_SIZE_EXCL = 5;
const BLOOD_PARTICLE_LIFETIME = 2;

const EXPLOSION_PARTICLE_COUNT = 50;
const EXPLOSION_PARTICLE_MAX_VEL = 10;
const EXPLOSION_PARTICLE_LIFETIME = 2;
const EXPLOSION_PARTICLE_SIZE = 5;

const TILE_PARTICLE_COUNT = 2;
const TILE_DESTROY_PARTICLE_COUNT = 6;
const TILE_PARTICLE_MAX_VEL = 5;
const TILE_PARTICLE_MIN_SIZE = 2;
const TILE_PARTICLE_MAX_SIZE_EXCL = 5;
const TILE_PARTICLE_LIFETIME = 2;

// Other settings
const BACKGROUND_COLOUR = [0x87, 0xCE, 0xFF];
const PIXEL_SIZE = 2;
const TILE_SIZE = 16;
const GRAVITY_STRENGTH = -0.4;
const COYOTE_JUMP_TIME = 0.05;
const CAMERA_LERP = 0.06;
const FRAME_DURATION = 1 / 60;
const CRATE_SPAWN_RATE = 0.002;
const TILE_HP = 5;
const DENSE_WALL_HP = 26;
const PLAYER2_ATLAS_INDEX_OFFSET = 3;

// Key bindings
class Key
{
    static LEFT = "KeyA";
    static RIGHT = "KeyD";
    static UP = "KeyW";
    static DOWN = "KeyS";
    static SHOOT = "KeyF";
    static JUMP = "KeyG";
    static GRENADE = "KeyH";

    static P2_LEFT = "ArrowLeft";
    static P2_RIGHT = "ArrowRight";
    static P2_UP = "ArrowUp";
    static P2_DOWN = "ArrowDown";
    static P2_SHOOT = "Period";
    static P2_JUMP = "Slash";
    static P2_GRENADE = "ShiftRight";
}

// Indices into sprite atlases

class TileAtlasIndex
{
    static WALL = 0;
    static SURFACE = 1;
    static LADDER = 2;
    static LANDMINE = 3;
    static LANDMINE_ACTIVE = 4;
    static BARRIER = 5;
    static FLAG = 6;
    static DENSE_WALL = 7;
}

class ObjectAtlasIndex
{
    static DEFAULT_BULLET = 0;
    static SNIPER_BULLET = 0;
    static FAST_BULLET = 1;
    static GRENADE_BULLET = 2;
    static BOMB = 3;
    static GRENADE_CRATE = 4;
    static FAST_GUN_CRATE = 5;
    static DEFAULT_GUN_CRATE = 6;
    static SNIPER_GUN_CRATE = 7;
    static GRENADE_GUN_CRATE = 8;
    static HEALTH_CRATE = 9;
    static BOX = 10;
}

class SolidColourAtlasIndex
{
    static BLOOD_PARTICLE = 0;
    static EXPLOSION_PARTICLE_1 = 1;
    static EXPLOSION_PARTICLE_2 = 2;
    static EXPLOSION_PARTICLE_3 = 3;
    static FADE_SCREEN = 4;
    static HEALTH = 5;
}

// Bullet properties

const DEFAULT_BULLET = {
    cooldown: 1 / 10,
    damage: 10 / 10, // 10 DPS
    velX: 8,
    velY: 0,
    range: 16 * TILE_SIZE,
    spread: 4,
    usePhysics: false,
    bouncyness: 0,
    lifetime: null,
    atlasIndex: ObjectAtlasIndex.DEFAULT_BULLET,
    useCircularHitbox: false,
    atlasRect: new Rect(
        0,
        0,
        16,
        2
    ),
    playerAtlasIndex: 7
};

const FAST_BULLET = {
    cooldown: 1 / 16,
    damage: 15 / 16, // 15 DPS
    velX: 12,
    velY: 0,
    range: 8 * TILE_SIZE,
    spread: 8,
    usePhysics: false,
    bouncyness: null,
    lifetime: null,
    atlasIndex: ObjectAtlasIndex.FAST_BULLET,
    useCircularHitbox: false,
    atlasRect: new Rect(
        0,
        0,
        8,
        2
    ),
    playerAtlasIndex: 8
};

const SNIPER_BULLET = {
    cooldown: 8 / 10,
    damage: 999, // One shot kill
    velX: 24,
    velY: 0,
    range: 32 * TILE_SIZE,
    spread: 1,
    usePhysics: false,
    bouncyness: null,
    lifetime: null,
    atlasIndex: ObjectAtlasIndex.SNIPER_BULLET,
    useCircularHitbox: false,
    atlasRect: new Rect(
        0,
        0,
        16,
        2
    ),
    playerAtlasIndex: 6
};

const GRENADE_BULLET = {
    cooldown: 0.5,
    damage: 3,
    velX: 7,
    velY: 5,
    range: null,
    spread: 1,
    usePhysics: true,
    bouncyness: 0.7,
    lifetime: 2.5,
    atlasIndex: ObjectAtlasIndex.GRENADE_BULLET,
    useCircularHitbox: false,
    atlasRect: new Rect(
        0,
        0,
        8,
        10
    ),
    playerAtlasIndex: 7
};
