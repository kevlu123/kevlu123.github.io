
// Base sprite class for player and enemies
class Character extends PhysicsSprite
{
    constructor(characterAtlasIndex, x, y, bulletType, isPlayer, hp)
    {
        super();

        this._timesSinceShot = new Map(); // Keep track of each bullet type
        this._isPlayer = isPlayer;
        this._hp = hp;
        this._dead = false;
        this._touchingLadder = false;
        this._onLadder = false;
        this._grenadeCount = MAX_GRENADES;
        this._isWalking = false;
        this._animationScheduled = false;
        this._animationIndex = 0;
        this._bulletType = bulletType;

        this.walkSpeed = PLAYER_WALK_SPEED;
        this.x = x;
        this.y = y;
        this.useGravity = true;
        this.dampingX = PLAYER_DAMPING_X;
        this.setImageView(new ImageView(
            CHARACTER_ATLAS_FILENAME,
            0,
            TILE_SIZE * characterAtlasIndex,
            TILE_SIZE,
            TILE_SIZE
        ));
        this.setRectangularHitbox(
            1,
            15,
            0,
            15
        );
        this.addCollidableSpriteList(levelTiles);
        this.addCollidableSpriteList(entities);
        
        this.rotationPivotY = 7;
    }

    update()
    {
        // Update physics
        super.update();

        // Add delta time to each value in _timesSinceShot
        let entries = Array.from(this._timesSinceShot.entries());
        for (let [key, val] of entries)
            this._timesSinceShot.set(key, val + FRAME_DURATION);

        // Die if player has fallen out of the world
        if (this.y < 0 && !this.isDead())
        {
            if (!isLastLevel())
                this.die();
            this.flop(this.flippedX ? -1 : 1);
        }

        // Ladder physics
        let prevLadderState = this._onLadder;
        this._touchingLadder = this.checkCollisionWithSprites(ladders);
        this._onLadder = this._touchingLadder && !this.isGrounded() && !this.isDead();

        if (prevLadderState != this._onLadder)
        {
            this.velY = 0;
            if (this._onLadder)
            {
                this.dampingX = PLAYER_DAMPING_X_LADDER;
                this.dampingY = 0;
                this.useGravity = false;
            }
            else
            {
                this.dampingX = PLAYER_DAMPING_X;
                this.dampingY = 1;
                this.useGravity = true;
            }
        }

        // Walk animation
        if (!this._isWalking)
            this._setIdleAnimation();
        else if (!this._animationScheduled)
        {
            this._animationScheduled = true;
            this._nextAnimationFrame();
        }
        this._isWalking = false;
    }

    _setIdleAnimation()
    {
        this.getImageView().x = 0;
    }

    _nextAnimationFrame()
    {
        if (this._isWalking)
        {
            this._animationIndex = (this._animationIndex + 1) % CHARACTER_WALK_ANIMATION_FRAMES;
            this.getImageView().x = TILE_SIZE * (this._animationIndex + 1);

            Timer.addTimer(CHARACTER_WALK_ANIMATION_FRAME_DURATION, this._nextAnimationFrame.bind(this));
        }
        else
        {
            this._animationScheduled = false;
        }
    }

    isDead()
    {
        return this._dead;
    }

    onShot(bulletType, collision)
    {
        this.damage(bulletType.damage);

        // If character is dead, flop the body
        if (this.isDead())
            this.flop(signof(collision.relVelX));
        
        // Create blood particles
        BloodBurstParticle.create(
            collision.x,
            collision.y
        );
    }

    damage(amount)
    {
        this._hp -= amount;
        if (this._hp <= 0)
            this.die();
    }

    moveLeft()
    {
        if (this._dead)
            return;

        this.velX -= this.walkSpeed;
        this.flippedX = true;
        this._isWalking = true;
    }

    moveRight()
    {
        if (this._dead)
            return;

        this.velX += this.walkSpeed;
        this.flippedX = false;
        this._isWalking = true;
    }

    moveDown()
    {
        if (this._dead || !this._touchingLadder)
            return;

        this.velY -= LADDER_SPEED_Y;
    }

    moveUp()
    {
        if (this._dead || !this._touchingLadder)
            return;

        this.y += LADDER_SPEED_Y;
        if (this.checkCollisionWithSprites(ladders))
            this.velY = LADDER_SPEED_Y;
        this.y -= LADDER_SPEED_Y;
    }

    jump()
    {
        if (this._dead || !this.isGrounded())
            return;

        this.velY = JUMP_VELOCITY;
    }

    // Creates a bullet if cooldown has passed
    shoot()
    {
        if (this._dead)
            return false;

        // Check if cooldown for the bulletType is ready
        let bulletType = this._bulletType;
        if (this._timesSinceShot.has(bulletType) && this._timesSinceShot.get(bulletType) <= bulletType.cooldown)
            return false;
        this._timesSinceShot.set(bulletType, 0);
        
        // Get spawn position
        let spawnX = this.x;
        let spawnY = this.y + BULLET_SPAWN_OFFSET_Y + randInt(0, bulletType.spread) - bulletType.spread / 2;
        if (this.flippedX)
            spawnX -= TILE_SIZE;
        else
            spawnX += TILE_SIZE;
    
        // Create bullet
        let bullet = new Bullet(
            spawnX,
            spawnY,
            this._isPlayer,
            bulletType,
            this.flippedX
        );

        bullet.addCollidableSpriteList(entities);
        bullets.push(bullet);

        AudioPlayer.play(SHOOT_SOUND_FILENAME);
        return true;
    }

    // Shoot a grenade if character still has grenades
    throwGrenade()
    {
        if (this._grenadeCount > 0)
        {
            let bulletType = this._bulletType;
            this._bulletType = GRENADE_BULLET;
            if (this.shoot())
                this._grenadeCount--;
            this._bulletType = bulletType;
        }
    }

    getGrenadeCount()
    {
        return this._grenadeCount;
    }

    // Reset grenade count
    refillGrenades()
    {
        this._grenadeCount = MAX_GRENADES;
    }

    // Flop the body
    flop(dirSign)
    {
        this.velX = DIE_VELOCITY_X * dirSign;
        this.velY = DIE_VELOCITY_Y;
    }

    onExplosion(x, y)
    {
        super.onExplosion(x, y);
        this.damage(EXPLOSION_DAMAGE);
    }

    die()
    {
        if (this._dead)
            return;

        this._dead = true;
        this._isWalking = false;
        this._hp = 0;
        this.angle = Math.PI / 2;
        this.dampingX = DIE_DAMPING_X;

        this._hitbox.y = 1;
    }

    isTouchingLadder()
    {
        return this._touchingLadder;
    }
}

// Base sprite class for enemies
class Enemy extends Character
{
    constructor(characterAtlasIndex, x, y, bulletType)
    {
        super(characterAtlasIndex, x, y, bulletType, false, ENEMY_HP);

        this.dampingX = ENEMY_DAMPING_X;
        this.walkSpeed = ENEMY_WALK_SPEED;
        this.flippedX = randBool();
        this._triggered = false;
    }

    update()
    {
        // If enemy has seen the player, walk and shoot
        let isNearPlayer = false;
        for (let player of players)
            if (distanceSqr(this.x, this.y, player.x, player.y) < ENEMY_AI_RADIUS ** 2)
            {
                isNearPlayer = true;
                break;
            }
        if (this._triggered && !this.isDead() && isNearPlayer)
        {
            if (time >= this._walkTime)
            {
                // Stop walking and set data for next walk
                if (time >= this._walkTime + this._walkDuration)
                    this._prepareWalk();
                
                else if (this.isGrounded())
                {
                    // Cast a ray in front of enemy
                    let hits = raycast(
                        this.x + TILE_SIZE / 2,
                        this.y + TILE_SIZE / 2,
                        this.flippedX ? -ENEMY_RAYCAST_DIR_X : ENEMY_RAYCAST_DIR_X,
                        ENEMY_RAYCAST_DIR_Y,
                        [levelTiles],
                        TILE_SIZE,
                        TILE_SIZE - 1
                    );

                    // Walk if there is floor in front and enemy is grounded
                    if (hits.length > 0)
                    {
                        if (this._walkLeft)
                            this.moveLeft();
                        else
                            this.moveRight();
                    }
                }
            }

            // Shoot
            if (time >= this._shootTime)
            {
                // Stop shooting and set data for next shoot
                if (time >= this._shootTime + this._shootDuration)
                    this._prepareShoot();
                else
                    this.shoot();
            }
        }
        else
        {
            // If player is in vision, trigger enemy

            let hits = new SpriteList();
            for (let player of players)
                if (distanceSqr(this.x, this.y, player.x, player.y) < ENEMY_VISION ** 2)
                    hits.push(...raycast(
                        this.x + TILE_SIZE / 2,
                        this.y + TILE_SIZE / 2,
                        this.flippedX ? -1 : 1,
                        0,
                        [levelTiles, players, entities],
                        ENEMY_VISION
                    ));

            if (!this.isDead() && hits.some(hit => players.includes(hit)))
            {
                this._trigger();
                this._prepareWalk();
                this._prepareShoot();
            }
        }

        super.update();
    }

    damage(amount)
    {
        super.damage(amount);
        if (this._hp <= OVERKILL_HP)
            this._overkill();
    }

    _trigger()
    {
        this._triggered = true;
        onEnemyTriggered();
    }

    _prepareWalk()
    {
        this._walkLeft = randBool();
        this._walkTime = time + randFloat(ENEMY_WALK_INTERVAL_MIN, ENEMY_WALK_INTERVAL_MAX);
        this._walkDuration = randFloat(ENEMY_WALK_DURATION_MIN, ENEMY_WALK_DURATION_MAX);
    }

    _prepareShoot()
    {
        this._shootTime = time + randFloat(ENEMY_SHOOT_INTERVAL_MIN, ENEMY_SHOOT_INTERVAL_MAX);
        this._shootDuration = randFloat(ENEMY_SHOOT_DURATION_MIN, ENEMY_SHOOT_DURATION_MAX);
    }

    _overkill()
    {
        for (let i = 0; i < 15; i++)
            BloodBurstParticle.create(
                this.x + 8,
                this.y + 8
            );
        this.destroy();
    }
}

class Enemy1 extends Enemy
{
    constructor(x, y)
    {
        super(2, x, y, DEFAULT_BULLET);
    }
}

class Enemy2 extends Enemy
{
    constructor(x, y)
    {
        super(1, x, y, FAST_BULLET);
    }
}

class Enemy3 extends Enemy
{
    constructor(x, y)
    {
        super(0, x, y, SNIPER_BULLET);
    }
}

class Player extends Character
{
    constructor(playerNumber=0)
    {
        let atlasIndex = DEFAULT_BULLET.playerAtlasIndex;
        if (playerNumber === 1)
            atlasIndex -= PLAYER2_ATLAS_INDEX_OFFSET;

        super(
            atlasIndex,
            0,
            0,
            DEFAULT_BULLET,
            true,
            PLAYER_HP
        );
        this._playerNumber = playerNumber;
    }

    die()
    {
        if (!isLastLevel())
            super.die();
    }
    
    getHealthPercentage()
    {
        if (this._hp <= 0)
            return 0;
        else
            return this._hp / PLAYER_HP;
    }

    heal()
    {
        if (this._hp > 0)
            this._hp = PLAYER_HP;
    }

    revive()
    {
        this._dead = false;
        this._isWalking = false;
        this._hp = PLAYER_HP;
        this.angle = 0;
        this.dampingX = PLAYER_DAMPING_X;
        this._hitbox.y = 0;
    }

    setGun(bulletType)
    {
        this._bulletType = bulletType;
        let atlasIndex = bulletType.playerAtlasIndex;
        if (this._playerNumber === 1)
            atlasIndex -= PLAYER2_ATLAS_INDEX_OFFSET;

        this.setImageView(new ImageView(
            CHARACTER_ATLAS_FILENAME,
            0,
            TILE_SIZE * atlasIndex,
            TILE_SIZE,
            TILE_SIZE
        ), false);
    }
}