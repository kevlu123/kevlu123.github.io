
class ImageLoader
{
    static _items = new Map();
    static _intervalID = null;
    static _callback = null;

    static loadImages(images, callback)
    {
        for (let image of images)
            ImageLoader._registerImage(image);

        ImageLoader._intervalID = window.setInterval(
            ImageLoader._update,
            FRAME_DURATION * 1000
        );
        ImageLoader._callback = callback;
    }

    static get(filename)
    {
        return ImageLoader._items.get(filename).image;
    }

    static _registerImage(filename)
    {
        let image = new Image();
        let item = {
            loaded: false,
            image: image
        };

        image.onload = () => {
            item.loaded = true;
        };
        image.src = filename;

        ImageLoader._items.set(filename, item);
    }

    static _update()
    {
        if ([...ImageLoader._items.values()].every(img => img.loaded))
        {
            window.clearInterval(ImageLoader._intervalID);
            ImageLoader._callback();
        }
    }
}
