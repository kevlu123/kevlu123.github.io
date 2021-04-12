
// Class that provides animating utilities
class Animator
{
    static _interpolations = [];
    
    static update()
    {
        // Interpolate properties
        for (let i = 0; i < Animator._interpolations.length; i++)
        {
            let interpol = Animator._interpolations[i];
            interpol.object[interpol.property] = lerp(
                interpol.from,
                interpol.to,
                (time - interpol.startTime) / interpol.duration
            );

            // Animation finished
            if (time - interpol.startTime >= interpol.duration)
            {
                interpol.object[interpol.property] = interpol.to;
                removeIndexFromArray(Animator._interpolations, i);
                i--;
            }
        }
    }

    // Interpolate a property over a period of time
    static interpolate(object, property, from, to, duration)
    {
        object[property] = from;
        Animator._interpolations.push({
            object: object,
            property: property,
            from: from,
            to: to,
            duration: duration,
            startTime: time
        });
    }
}
