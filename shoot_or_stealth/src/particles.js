
class Particle
{
    static _particles = new SpriteList();

    static getSprites()
    {
        return Particle._particles;
    }

    // Creates a single particle, adds it to the particles sprite list, and returns the particle
    static create(imageView, lifetime)
    {
        let particle = new PhysicsSprite();
        particle.setImageView(imageView);
        particle.setCircularHitbox();
        particle._endTime = lifetime + time;
        Particle._particles.push(particle);
        return particle;
    }

    // Update each particle and check if lifetime has passed for each particle
    static update()
    {
        let copy = new SpriteList();
        copy.push(...Particle._particles);

        for (let particle of copy)
        {
            particle.update();
            if (time >= particle._endTime)
                particle.destroy();
        }
    }
}

// Creates a single burst of sprites
class BurstParticle
{
    // Creates multiple particles and returns a sprite list of them
    static create(imageView, x, y, count, vel, lifetime)
    {
        let particles = new SpriteList();

        for (let i = 0; i < count; i++)
        {
            let particle = Particle.create(imageView, lifetime);

            particle.useGravity = true;
            particle.x = x;
            particle.y = y;
            
            // Set random velocity direction
            let dir = randAngle();
            particle.velX = randFloat(0, vel) * Math.cos(dir);
            particle.velY = randFloat(0, vel) * Math.sin(dir);

            particles.push(particle);
        }

        return particles;
    }
}

class BloodBurstParticle extends BurstParticle
{
    static create(x, y)
    {
        // Create a burst of particles with no image view set
        let particles = BurstParticle.create(
            null,
            x,
            y,
            BLOOD_PARTICLE_COUNT,
            BLOOD_PARTICLE_MAX_VEL,
            BLOOD_PARTICLE_LIFETIME,
        );

        for (let particle of particles)
        {
            // Choose random size for each particle
            let size = randInt(
                BLOOD_PARTICLE_MIN_SIZE,
                BLOOD_PARTICLE_MAX_SIZE_EXCL,
            );

            // Set image view
            let imageView = ImageView.fromAtlas(
                SOLIDCOLOURS_ATLAS_FILENAME,
                SolidColourAtlasIndex.BLOOD_PARTICLE,
                0,
                0,
                size,
                size
            );
            particle.setImageView(imageView);
        }
    }
}

class ExplosionBurstParticle extends BurstParticle
{
    static create(x, y)
    {
        // Create a burst of particles with no image view set
        let particles = BurstParticle.create(
            null,
            x,
            y,
            EXPLOSION_PARTICLE_COUNT,
            EXPLOSION_PARTICLE_MAX_VEL,
            EXPLOSION_PARTICLE_LIFETIME
        );

        for (let particle of particles)
        {
            // Set a random image view for each particle
            let imageView = ImageView.fromAtlas(
                SOLIDCOLOURS_ATLAS_FILENAME,
                randItem(ExplosionBurstParticle._atlasIndices),
                0,
                0,
                EXPLOSION_PARTICLE_SIZE,
                EXPLOSION_PARTICLE_SIZE
            );
            particle.setImageView(imageView);
        }
    }

    // Possible atlas indices for each particle
    static _atlasIndices = [
        SolidColourAtlasIndex.EXPLOSION_PARTICLE_1,
        SolidColourAtlasIndex.EXPLOSION_PARTICLE_2,
        SolidColourAtlasIndex.EXPLOSION_PARTICLE_3,
    ];
}

class TileBurstParticle extends BurstParticle
{
    static create(x, y, imageView, count)
    {
        // Create a burst of particles with no image view set
        let particles = BurstParticle.create(
            null,
            x,
            y,
            count,
            TILE_PARTICLE_MAX_VEL,
            TILE_PARTICLE_LIFETIME,
        );

        for (let particle of particles)
        {
            // Choose random size and offset for each particle
            let size = randInt(
                TILE_PARTICLE_MIN_SIZE,
                TILE_PARTICLE_MAX_SIZE_EXCL,
            );
            let offsetX = imageView.x + randInt(0, imageView.width - size);
            let offsetY = imageView.y + randInt(0, imageView.height - size);

            // Set image view
            let newImageView = imageView.clone();
            newImageView.x = offsetX;
            newImageView.y = offsetY;
            newImageView.width = size;
            newImageView.height = size;
            particle.setImageView(newImageView);
        }
    }
}
