
class Tile extends Sprite
{
    constructor(tileIndex, x, y, hp=TILE_HP)
    {
        super();

        this.setImageView(ImageView.fromAtlas(TILE_ATLAS_FILENAME, tileIndex));
        this.x = x;
        this.y = y;
        this.explodable = false;
        this.shootable = false;
        this._hp = hp;
    }

    onExplosion()
    {
        if (this.explodable)
            this._damage(EXPLOSION_DAMAGE);
    }

    onShot(bulletType, collision)
    {
        if (bulletType === GRENADE_BULLET)
            return;

        // Create particles
        TileBurstParticle.create(
            collision.x,
            collision.y,
            this.getImageView(),
            TILE_PARTICLE_COUNT
        );
        
        // Damage tile
        if (this.shootable)
            this._damage(bulletType.damage);
    }

    _damage(amount)
    {
        this._hp -= amount;
        if (this._hp <= 0)
        {
            TileBurstParticle.create(
                this.x + TILE_SIZE / 2,
                this.y + TILE_SIZE / 2,
                this.getImageView(),
                TILE_DESTROY_PARTICLE_COUNT
            );
            this.destroy();
        }
    }
}

class WallTile extends Tile
{
    constructor(x, y)
    {
        super(TileAtlasIndex.WALL, x, y);
        this.explodable = true;
        this.shootable = true;
    }
}

class DenseWallTile extends Tile
{
    constructor(x, y)
    {
        super(TileAtlasIndex.DENSE_WALL, x, y, DENSE_WALL_HP);
        this.explodable = true;
        this.shootable = true;
    }
}

class SurfaceTile extends Tile
{
    constructor(x, y)
    {
        super(TileAtlasIndex.SURFACE, x, y);
        this.explodable = true;
        this.shootable = true;
    }
}

// End of the level
class EndTile extends Tile
{
    constructor(x, y)
    {
        super(TileAtlasIndex.BARRIER, x, y);
    }
}

// Indestructible wall
class BarrierTile extends Tile
{
    constructor(x, y)
    {
        super(TileAtlasIndex.BARRIER, x, y);
    }
}

class LadderTile extends Tile
{
    constructor(x, y)
    {
        super(TileAtlasIndex.LADDER, x, y);
        ladders.push(this);
        this.setRectangularHitbox(
            0,
            TILE_SIZE,
            0,
            TILE_SIZE + 1
        );
    }
}

class LandMineTile extends Tile
{
    constructor(x, y)
    {
        super(TileAtlasIndex.LANDMINE, x, y);
        this._willExplode = false;
    }

    update()
    {
        // Player stand on landmine
        if (players.some(p => p.getGroundedOn().includes(this)))
            this._explode();
            
        // Enemy stand on landmine
        if (enemies.some(e => e.getGroundedOn().includes(this)))
            this._explode();
    }

    onExplosion()
    {
        this._explode();
    }

    onShot(bulletType, collision)
    {
        super.onShot(bulletType, collision);
        this._explode();
    }

    _explode()
    {
        // Destroy this and create another explosion
        if (!this._willExplode)
        {
            this._willExplode = true;

            // Change image view
            this.setImageView(ImageView.fromAtlas(
                TILE_ATLAS_FILENAME,
                TileAtlasIndex.LANDMINE_ACTIVE
            ));

            // Schedule explosion
            Timer.addTimer(BOMB_EXPLOSION_DELAY, function()
            {
                // Check if this still exists
                if (!this.isDestroyed())
                {
                    this.destroy();
                    createExplosion(this.x, this.y);
                }
            }.bind(this));
        }
    }
}
