
// Represents a part of an image. Useful for sprite sheets.
class ImageView
{
    constructor(filename, x=null, y=null, w=null, h=null)
    {
        this._filename = filename;
        this._image = ImageLoader.get(filename);
    
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.width = w ?? this._image.width;
        this.height = h ?? this._image.height;
    }

    // Create an ImageView from a single row sprite atlas with a height of TILE_SIZE.
    static fromAtlas(filename, index, xOffset=0, yOffset=0, width=TILE_SIZE, height=TILE_SIZE)
    {
        return new ImageView(
            filename,
            TILE_SIZE * index + xOffset,
            yOffset,
            width,
            height
        );
    }

    // Get full underlying image
    getImage()
    {
        return this._image;
    }

    clone()
    {
        return new ImageView(
            this._filename,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
}

// Collection of sprites
class SpriteList
{
    constructor(sprites=[])
    {
        this._sprites = sprites;
        this.length = sprites.length;
    }

    // Allow use in for...of loop
    [Symbol.iterator]()
    {
        return this._sprites.values();
    }

    // Get sprite by index
    get(index)
    {
        return this._sprites[index];
    }

    // Calls f for each sprite in the list. Supports destroy() while iterating.
    forEach(f)
    {
        for (let i = 0; i < this.length; i++)
        {
            let sprite = this.get(i);
            f(sprite);
            if (sprite.isDestroyed())
                i--;
        }
    }

    // Appends sprites that are not already in this list
    pushUnique(...sprites)
    {
        this._sprites.push(...sprites);
        for (let sprite of sprites)
            if (!sprite._destroyed && !this.includes(sprite))
                sprite._spriteLists.push(this);
        this.length += sprites.length;
    }

    // Remove a sprite from the list
    remove(sprite)
    {
        removeFromArray(this._sprites, sprite);
        this.length--;
    }

    // Delete all items from the list
    clear()
    {
        this._sprites = [];
        this.length = 0;
    }

    // Array methods

    push(...sprites)
    {
        this._sprites.push(...sprites);
        for (let sprite of sprites)
            if (!sprite._destroyed)
                sprite._spriteLists.push(this);
        this.length += sprites.length;
    }

    filter(predicate)
    {
        return new SpriteList(this._sprites.filter(predicate));
    }

    includes(sprite)
    {
        return this._sprites.includes(sprite);
    }

    some(predicate)
    {
        return this._sprites.some(predicate);
    }

    every(predicate)
    {
        return this._sprites.every(predicate);
    }

    map(selector)
    {
        return this._sprites.map(selector);
    }
    
    concat(spriteList)
    {
        let li = new SpriteList();
        li.push(...this._sprites);
        li.push(...spriteList._sprites);
        return li;
    }
}

// Sprite list optimized for tiles
class TileSpriteList
{
    constructor(sprites=[])
    {
        this._sprites = [];
        this.push(...sprites);
    }

    // Array methods

    push(...sprites)
    {
        for (let sprite of sprites)
        {
            let x = Math.floor(sprite.x / TILE_SIZE);
            let y = Math.floor(sprite.y / TILE_SIZE);

            resizeArray(this._sprites, y + 1, []);
            resizeArray(this._sprites[y], x, null);
            this._sprites[y][x] = sprite; 

            sprite._spriteLists.push(this);
        }
    }

    get(x, y)
    {
        if (y < 0 || x < 0)
            return null;
        else if (y < this._sprites.length && x < this._sprites[y].length)
            return this._sprites[y][x];
        else
            return null;
    }
}

// Represents a 2D image in space
class Sprite
{
    constructor(imageView=null)
    {
        if (imageView !== null)
            this.setImageView(imageView);
        else
            this.setCircularHitbox(0);

        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.rotationPivotX = 0;
        this.rotationPivotY = 0;
        this.flippedX = false;
        this.alpha = 1;

        this._spriteLists = [];
        this._destroyed = false;
    }
    
    destroy()
    {
        for (let list of this._spriteLists)
        {
            if (list.constructor.name === "TileSpriteList")
            {
                let x = Math.floor(this.x / TILE_SIZE);
                let y = Math.floor(this.y / TILE_SIZE);
                list._sprites[y][x] = null;
            }
            else
            {
                removeFromArray(list._sprites, this);
                list.length--;
            }
        }
        this._spriteLists = [];
        this._destroyed = true;
    }

    isDestroyed()
    {
        return this._destroyed;
    }

    getImageView()
    {
        return this._imageView;
    }

    // Sets the image view and optionally automatically sets the hitbox
    setImageView(imageView, autoHitbox=true)
    {
        this._imageView = imageView;

        if (imageView !== null && autoHitbox)
        {
            this.setRectangularHitbox(
                0,
                imageView.width,
                0,
                imageView.height
            );
            this.rotationPivotX = imageView.width / 2;
            this.rotationPivotY = imageView.height / 2;
        }
    }

    // Set an axis aligned rectangular hitbox relative to the pivot
    setRectangularHitbox(left, right, bottom, top)
    {
        this._hasCircularHitbox = false;
        this._hitbox = new Rect(
            left,
            bottom,
            Math.abs(right - left),
            Math.abs(top - bottom)
        );
    }

    // Set a circular hitbox
    setCircularHitbox(x=null, y=null, r=null)
    {
        // If no arguments were passed, try to set a hitbox automatically
        if (x === null)
        {
            if (!this._hasCircularHitbox)
            {
                // Approximate circle from rectangle
                x = this._hitbox.w / 2 + this._hitbox.x;
                y = this._hitbox.h / 2 + this._hitbox.y;
                r = (this._hitbox.w + this._hitbox.h) / 4;
            }
            else
            {
                // Already has a circle hitbox
                return;
            }
        }

        this._hasCircularHitbox = true;
        this._hitbox = new Circle(x, y, r);
    }

    // Checks for collision with another sprite
    checkCollisionWithSprite(sprite)
    {
        // Can't collide with self
        if (sprite === this)
            return false;

        let thisX = Math.floor(this.x);
        let thisY = Math.floor(this.y);
        let spriteX = Math.floor(sprite.x);
        let spriteY = Math.floor(sprite.y);

        if (!this._hasCircularHitbox && !sprite._hasCircularHitbox)
        {
            // Rectangle/Rectangle
            let r1 = this._hitbox.clone();
            r1.x += thisX;
            r1.y += thisY;
            let r2 = sprite._hitbox.clone();
            r2.x += spriteX;
            r2.y += spriteY;
            return !(r2.left()   >= r1.right()
                  || r2.right()  <= r1.left()
                  || r2.bottom() >= r1.top()
                  || r2.top()    <= r1.bottom());
        }
        else if (this._hasCircularHitbox && sprite._hasCircularHitbox)
        {
            // Circle/Circle
            thisX += this._hitbox.x;
            thisY += this._hitbox.y;
            spriteX += this._hitbox.x;
            spriteY += this._hitbox.y;
            let distSq = distanceSqr(thisX, thisY, spriteX, spriteY);
            return distSq < (this._hitbox.r + sprite._hitbox.r) ** 2;
        }
        else
        {
            // Rectangle/Circle

            let rect;
            let circle;
            if (sprite._hasCircularHitbox)
            {
                rect = this._hitbox.clone();
                rect.x += thisX;
                rect.y += thisY;

                circle = sprite._hitbox.clone();
                circle.x += spriteX;
                circle.y += spriteY;
            }
            else
            {
                rect = sprite._hitbox.clone();
                rect.x += spriteX;
                rect.y += spriteY;

                circle = this._hitbox.clone();
                circle.x += thisX;
                circle.y += thisY;
            }

            // Find the nearest point in the rectangle to the circle
            let nearestX = clamp(circle.x, rect.left(), rect.right());
            let nearestY = clamp(circle.y, rect.bottom(), rect.top());

            // If this point is inside the circle, there is a collision
            let distSq = (circle.x - nearestX) ** 2 + (circle.y - nearestY) ** 2;
            return distSq < circle.r ** 2;
        }
    }

    // Checks for collision against a list of sprites
    checkCollisionWithSprites(sprites)
    {
        if (sprites.constructor.name === "TileSpriteList")
        {
            for (let tile of getNearbyTiles(this.x, this.y, 2 * TILE_SIZE))
                if (tile.checkCollisionWithSprite(this))
                    return true;
        }
        else
        {
            // Normal sprite list collision
            for (let sprite of sprites)
                if (this.checkCollisionWithSprite(sprite))
                    return true;
        }
        return false;
    }

    // Returns a list of sprites which are colliding with this
    getCollisionWithSprites(sprites)
    {
        let collidingWith = [];
        if (sprites.constructor.name === "TileSpriteList")
        {
            // Optimized sprite list collision for tiles
            for (let tile of getNearbyTiles(this.x, this.y, 2 * TILE_SIZE))
                if (tile.checkCollisionWithSprite(this))
                    collidingWith.push(tile);
        }
        else
        {
            // Normal sprite list collision
            for (let sprite of sprites)
                if (this.checkCollisionWithSprite(sprite))
                collidingWith.push(sprite);
        }
        return collidingWith;
    }

    // Checks if this sprite is within EXPLOSION_RADIUS of an explosion at x, y
    isNearExplosion(x, y)
    {
        return distance(x, y, this.x, this.y) <= EXPLOSION_RADIUS;
    }
}

// Data about a collision
class Collision
{
    constructor(collider, collidee, x, y, relVelX, relVelY)
    {
        this.collider = collider;
        this.collidee = collidee;
        this.x = x;
        this.y = y;
        this.relVelX = relVelX;
        this.relVelY = relVelY;
    }
}

// Moving sprite that is affected by collisions
class PhysicsSprite extends Sprite
{
    constructor(imageView)
    {
        super(imageView);

        // Translational properties
        this.velX = 0;
        this.velY = 0;
        this.dampingX = 1;
        this.dampingY = 1;
        this.bouncynessX = 0;
        this.bouncynessY = 0;
        this.useGravity = false;

        // Rotational properties
        this.angularVel = 0;
        this.angularDamping = 1;
        
        // Collision properties
        this._collidableSpriteLists = [];
        this.onCollision = null;
        this.collisionDampingX = 1;
        this.collisionDampingY = 1;
        this.angularCollisionDamping = 1;
        this._groundedState = 0;
        this._lastCollisionX = null;
        this._lastCollisionY = null;
        this._groundedOn = new SpriteList();
    }

    // Applies velocity and gravity and checks for collision
    update()
    {
        if (this._groundedState > 0)
            this._groundedState -= FRAME_DURATION;
        else if (this._groundedOn.length > 0)
            this._groundedOn = new SpriteList();

        // Apply gravity
        if (this.useGravity)
            this.velY += GRAVITY_STRENGTH;

        let collidingWithX = [];
        let collidingWithY = [];
        let thisVelX = this.velX;
        let thisVelY = this.velY;
        this._lastCollisionX = null;
        this._lastCollisionY = null;

        // Move in y axis
        let velYSign = signof(this.velY);
        if (this.velY !== 0)
        {
            this.y += this.velY;
            collidingWithY = this.getCollidingWith();
            if (collidingWithY.length > 0)
            {
                // If collided and move back until not colliding
                this.ejectCollisionY();
                
                // If collided while moving down, the sprite is grounded
                if (velYSign < 0)
                {
                    this._groundedState = COYOTE_JUMP_TIME;
                    this._groundedOn.pushUnique(...collidingWithY);
                }

                // Bounce off
                this.velY *= -this.bouncynessY;
            }
        }

        // Move in X axis
        let velXSign = signof(this.velX);
        if (this.velX)
        {
            this.x += this.velX;
            collidingWithX = this.getCollidingWith();
            if (collidingWithX.length > 0)
            {
                // If collided and move back until not colliding
                this.ejectCollisionX();
                
                // Bounce off
                this.velX *= -this.bouncynessX;
            }
        }
        
        // Apply angular velocity
        this.angle += this.angularVel;

        // Velocity and angular velocity damping
        this.velX *= this.dampingX;
        this.velY *= this.dampingY;
        this.angularVel *= this.angularDamping;
        if (this.velY < -TERMINAL_VELOCITY)
            this.velY = -TERMINAL_VELOCITY;

        // Collisions
        let collidingWith = [];
        collidingWith.push(...collidingWithX);
        collidingWith.push(...collidingWithY);
        if (collidingWith.length > 0)
        {
            // Apply collision damping
            this.velX *= this.collisionDampingX;
            this.velY *= this.collisionDampingY;
            this.angularVel *= this.angularCollisionDamping;
            
            // Reverse rotation if rotating against a surface
            if (collidingWithX.length > 0 && (velXSign > 0) != (signof(this.angularVel) !== velYSign))
                this.angularVel *= -1;
            else if (collidingWithY.length > 0 && (velYSign > 0) != (signof(this.angularVel) === velXSign))
                this.angularVel *= -1;

            // Call oncollision event
            if (this.onCollision !== null)
                this.onCollision(collidingWith.map(sprite => new Collision(
                    this,
                    sprite,
                    this._lastCollisionX ?? this.x,
                    this._lastCollisionY ?? this.y,
                    thisVelX - sprite.velX,
                    thisVelY - sprite.velY,
                )));
            for (let sprite of collidingWith)
                if ("onCollision" in sprite && sprite.onCollision !== null)
                    sprite.onCollision([new Collision(
                        sprite,
                        this,
                        this._lastCollisionX ?? this.x,
                        this._lastCollisionY ?? this.y,
                        sprite.velX - thisVelX,
                        sprite.velY - thisVelY
                    )]);
        }
    }

    addCollidableSpriteList(...spriteLists)
    {
        this._collidableSpriteLists.push(...spriteLists);
    }
    
    isGrounded()
    {
        return this.useGravity && this._groundedState > 0;
    }

    // Checks if this sprite is colliding with any of collidableSprites
    isColliding()
    {
        let self = this;
        return this._collidableSpriteLists.some(list => self.checkCollisionWithSprites(list));
    }

    // Gets the sprites which are coliding with this
    getCollidingWith()
    {
        let hits = new SpriteList();
        for (let list of this._collidableSpriteLists)
            hits.push(...this.getCollisionWithSprites(list));
        return hits;
    }

    // Gets a list of sprites that this sprite is currently grounded on
    getGroundedOn()
    {
        return this._groundedOn;
    }

    // Move out of collision in the x-axis
    ejectCollisionX()
    {
        this._ejectCollision(true);
    }

    // Move out of collision in the y-axis
    ejectCollisionY()
    {
        this._ejectCollision(false);
    }

    // Explosion event
    onExplosion(x, y)
    {
        let dir = Math.atan2(this.y - y, this.x - x);
        this.velX += Math.cos(dir) * EXPLOSION_FORCE;
        this.velY += Math.sin(dir) * EXPLOSION_FORCE;
    }

    // Move out of collision in the y-axis then the x-axis
    ejectCollision()
    {
        this.ejectCollisionY();
        this.ejectCollisionX();
    }

    // Move out of collision in an axis
    _ejectCollision(isHorizontal)
    {
        // Get property names
        let axis = isHorizontal ? "x" : "y";
        let otherAxis = isHorizontal ? "y" : "x";
        let vel = isHorizontal ? "velX" : "velY";
        let negSide = isHorizontal ? "left" : "bottom";
        let posSide = isHorizontal ? "right" : "top";

        if (this[vel] === 0)
            return;

        let moveNeg = this[vel] > 0;
        let walls = this.getCollidingWith();
        while (walls.length > 0)
        {
            let k = null;

            for (let wall of walls)
            {
                let newK;
                if (wall._hasCircularHitbox)
                {
                    let n = this[otherAxis] - wall[otherAxis] - wall._hitbox[otherAxis];
                    newK = Math.sqrt(wall._hitbox.r ** 2, n ** 2);
                    if (moveNeg)
                        newK *= -1;
                }
                else
                {
                    if (moveNeg)
                        newK = wall._hitbox[negSide]();
                    else
                        newK = wall._hitbox[posSide]();
                }
                newK += wall[axis];
                
                if (k === null || moveNeg === (newK < k))
                    k = newK;
            }

            if (isHorizontal)
                this._lastCollisionX = k;
            else
                this._lastCollisionY = k;

            // Account for this hitbox
            if (this._hasCircularHitbox)
            {
                if (moveNeg)
                    k -= this._hitbox[axis] + this._hitbox.r;
                else
                    k -= this._hitbox[axis] - this._hitbox.r;
            }
            else
            {
                if (moveNeg)
                    k -= this._hitbox[posSide]();
                else
                    k -= this._hitbox[negSide]();
            }

            this[axis] = k;

            walls = this.getCollidingWith();
        }
    }
}
