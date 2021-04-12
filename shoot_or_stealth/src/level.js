
class Level
{
    // Loads level data from a multiline string representing the layout
    constructor(data)
    {
        // Split string into lines representing rows of tiles
        let lines = data.split("\n");
        lines.reverse();

        // Buffer height
        for (let i = 0; i < 10; i++)
            lines.push("");
        
        // Get width and height
        this._width = Math.max(0, ...lines.map(line => line.length))
        this._height = lines.length;

        // Pad all lines to max width
        for (let i = 0; i < lines.length; i++)
            lines[i] = lines[i].padEnd(this._width, ' ');

        // Create left and right border walls
        for (let y = 0; y < this._height; y++)
            lines[y] = "B" + lines[y] + "B";
        this._width += 2;

        // Set default spawn and level finish positions
        this._endTiles = new SpriteList();

        // Replace top dirt with grass
        let notAirBlocks = ['.', ',', 'e', '_', 'm'];
        for (let y = 0; y < this._height - 1; y++)
            for (let x = 0; x < this._width; x++)
                if (lines[y][x] === '.' && !notAirBlocks.includes(lines[y + 1][x]))
                    lines[y] = changeChar(lines[y], x, '_');

        // Load each tile
        let surfaceTiles = new SpriteList();
        for (let y = 0; y < this._height; y++)
            for (let x = 0; x < this._width; x++)
            {
                let tileClass = null;
                let enemyClass = null;
                let entityClass = null;

                let c = lines[y][x];
                switch (c)
                {
                    // Create level tiles
                    case '.': tileClass = WallTile;     break;
                    case ',': tileClass = DenseWallTile;     break;
                    case '_': tileClass = SurfaceTile;  break;
                    case 'e': tileClass = EndTile;      break;
                    case 'B': tileClass = BarrierTile;  break;
                    case 'H': tileClass = LadderTile;   break;
                    case 'm': tileClass = LandMineTile; break;
                    
                    // Spawn enemies
                    case '1': enemyClass = Enemy1; break;
                    case '2': enemyClass = Enemy2; break;
                    case '3': enemyClass = Enemy3; break;
                    
                    // Create entities
                    case 'x': entityClass = BombBlock; break;
                    case 'b': entityClass = BoxBlock;  break;
                    case 'c': entityClass = randItem(ItemCrate.getCrateTypes()); break;

                    // Set start position
                    case 's': this._startPos = [x, y]; break;
                }

                if (tileClass !== null)
                {
                    // Instantiate tile
                    let tile = new tileClass(
                        TILE_SIZE * x,
                        TILE_SIZE * y
                    );

                    if (tileClass === SurfaceTile)
                        surfaceTiles.push(tile);

                    if (tileClass === EndTile)
                    {
                        this._endTiles.push(tile);

                        // Create flag
                        let flag = new Sprite(ImageView.fromAtlas(
                            TILE_ATLAS_FILENAME,
                            TileAtlasIndex.FLAG
                        ));
                        flag.x = tile.x;
                        flag.y = tile.y + TILE_SIZE;
                        backgroundTiles.push(flag);
                    }
                    
                    if (tileClass !== LadderTile)
                        levelTiles.push(tile);
                    if ("update" in tile)
                        updatableTiles.push(tile);
                }
                else if (enemyClass !== null)
                {
                    // Instantiate enemy
                    let enemy = new enemyClass(
                        TILE_SIZE * x,
                        TILE_SIZE * y
                    );
                    enemies.push(enemy);
                }
                else if (entityClass !== null)
                {
                    // Instantiate entity
                    let entity = new entityClass(
                        TILE_SIZE * x,
                        TILE_SIZE * y
                    );
                    entities.push(entity);
                }
            }

        // Randomly spawn crates
        for (let tile of surfaceTiles)
            if (randBool(CRATE_SPAWN_RATE))
            {
                let crateClass = randItem(ItemCrate.getCrateTypes());
                let crate = new crateClass(
                    tile.x,
                    tile.y + TILE_SIZE
                );

                if (crate.isColliding())
                    crate.destroy();
                else
                    entities.push(crate);
            }
    }

    getStartPos()
    {
        return this._startPos;
    }

    getEndTiles()
    {
        return this._endTiles;
    }

    getWidth()
    {
        return this._width;
    }
}
