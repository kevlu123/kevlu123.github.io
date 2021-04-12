
class Timer
{
    static _timers = [];

    static update()
    {
        for (let i = 0; i < Timer._timers.length; i++)
        {
            let timer = Timer._timers[i];
            if (time >= timer.endTime)
            {
                timer.f();
                removeIndexFromArray(Timer._timers, i);
            }
        }
    }

    static addTimer(delay, f)
    {
        Timer._timers.push({
            endTime: time + delay,
            f: f
        });
    }
}
