
class Circle
{
    constructor(x, y, r)
    {
        this.x = x;
        this.y = y;
        this.r = r;
    }

    // Gets the leftmost point of the circle
    left()
    {
        return this.x - this.r;
    }

    // Gets the rightmost point of the circle
    right()
    {
        return this.x + this.r;
    }

    // Gets the bottom-most point of the circle
    bottom()
    {
        return this.y - this.r;
    }

    // Gets the topmost point of the circle
    top()
    {
        return this.y + this.r;
    }

    // Creates a copy of this object
    clone()
    {
        return new Circle(
            this.x,
            this.y,
            this.r
        );
    }
}

class Rect
{
    constructor(x, y, w, h)
    {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    left()
    {
        return this.x;
    }

    top()
    {
        return this.y + this.h;
    }

    right()
    {
        return this.x + this.w;
    }

    bottom()
    {
        return this.y;
    }

    // Create a copy of this object
    clone()
    {
        return new Rect(
            this.x,
            this.y,
            this.w,
            this.h
        );
    }
}

// Clamps x between min and max
function clamp(x, min, max)
{
    if (x < min)
        return min;
    else if (x > max)
        return max;
    else
        return x;
}

// Gets the sign of x. Returns -1, 0, or 1
function signof(x)
{
    if (x < 0)
        return -1;
    else if (x > 0)
        return 1;
    else
        return 0;
}

// Linear interpolation between a and b
function lerp(a, b, interpolation)
{
    return (b - a) * interpolation + a;
}

// Gets the squared distance between two points
function distanceSqr(x1, y1, x2, y2)
{
    return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}

// Gets the distance between two points
function distance(x1, y1, x2, y2)
{
    return Math.sqrt(distanceSqr(x1, y1, x2, y2));
}

// Removes the item at an index from an array
function removeIndexFromArray(array, index)
{
    array.splice(index, 1);
}

// Removes an item from an array
function removeFromArray(array, value)
{
    let index = array.indexOf(value);
    array.splice(index, 1);
}

function createArrayWithLen(len, val)
{
    let arr = [];
    resizeArray(arr, len);
    for (let i = 0; i < len; i++)
        arr[i] = val;
    return arr;
}

function resizeArray(array, size, defaultValue=null)
{
    while(array.length < size)
        array.push(defaultValue);
}

function randInt(min, maxExcl)
{
    return Math.floor(Math.random() * (maxExcl - min) + min);
}

function randFloat(min, maxExcl)
{
    return Math.random() * (maxExcl - min) + min;
}

function randBool(probability=0.5)
{
    return randFloat(0, 1) < probability;
}

function randAngle()
{
    return randFloat(0, 2 * Math.PI);
}

// Returns incr added to val, wrapped around a range
function wrappedIncrement(val, incr, min, maxExcl)
{
    return (val + incr) % (maxExcl - min) + min;
}

// Casts a ray and gets a list of sprites that the ray hits
function raycast(srcX, srcY, dirX, dirY, collidableSpriteLists, range=100, step=4)
{    
    // Create sprite for collision test
    let ray = new PhysicsSprite();
    ray.setCircularHitbox(0, 0, 0.01);
    ray.addCollidableSpriteList(...collidableSpriteLists);

    let hits = new SpriteList();
    let dist = 0;
    do
    {
        // Get current ray position
        ray.x = srcX + dist * dirX;
        ray.y = srcY + dist * dirY;

        // Check collision
        hits = ray.getCollidingWith();

        // Move ray
        dist += step;
    }
    while (hits.length === 0 && dist < range);

    ray.destroy();
    return hits;
}

// Returns a random item in an array
function randItem(array)
{
    return array[randInt(0, array.length)];
}

// Change a character in a string
function changeChar(s, index, c)
{
    return s.substring(0, index) + c + s.substring(index + 1);
}
