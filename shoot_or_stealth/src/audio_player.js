
class AudioPlayer
{
    static play(filename)
    {
        let aud = new Audio(filename);
        aud.volume = 0.6;
        aud.play();
    }

    static playLooped(filename)
    {
        let aud = new Audio(filename);
        aud.loop = true;
        aud.play();
    }
}
