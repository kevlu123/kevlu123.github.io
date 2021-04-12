
class UIScaling
{
    // Use size as a proportion of the screen width
    static WIDTH = 0;
    // Use size as a proportion of the screen height
    static HEIGHT = 1;
    // Same as WIDTH but uses HEIGHT if image will not fit on screen
    static WIDTH_THEN_HEIGHT = 2;
    // Same as HEIGHT but uses WIDTH if image will not fit on screen
    static HEIGHT_THEN_WIDTH = 3;
    // Size is a 2-element array of functions to calculate the width and height
    static CUSTOM = 4;
}

class UISprite
{
    constructor(imageView)
    {
        this._imageView = imageView;
        this._aspect = this._imageView.width / this._imageView.height;

        this.alpha = 1;

        this.pivotX = 0.5;
        this.pivotY = 0.5;

        // Formulae to calculate position dynamically from screen width and height
        this.x = (w, h) => w / 2;
        this.y = (w, h) => h / 2;

        // Determines what the size property means
        this.scalingType = UIScaling.WIDTH_THEN_HEIGHT;
        this.size = 1;

        this.rawWidth = 0;
        this.rawHeight = 0;
    }

    getImageView()
    {
        return this._imageView;
    }

    // Get the width divided by the height of the image
    getAspectRatio()
    {
        return this._aspect;
    }
}
