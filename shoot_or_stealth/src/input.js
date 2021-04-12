
class KeyState
{
    static NOT_HELD = 0;
    static JUST_HELD = 1;
    static HELD = 2;
    static RELEASED = 3;
}

// Provides more detailed input information
class Input
{
    constructor()
    {
        this._keyStates = new Map();
        window.onkeydown = this._onkeydown.bind(this);
        window.onkeyup = this._onkeyup.bind(this);
    }

    // Changes the state of keys from JUST_HELD to HELD and JUST_RELEASED to NOT_HELD.
    // This should be called at the end of the update loop.
    update()
    {
        // Get a list of keys that need to be changed
        let toChange = [];
        for (let [key, state] of this._keyStates.entries())
        {
            if (state === KeyState.JUST_HELD)
                toChange.push([key, KeyState.HELD]);
            else if (state === KeyState.JUST_RELEASED)
                toChange.push([key, KeyState.NOT_HELD]);
        }

        // Change the state of the keys here so the map
        // isn't modified while being iterated through
        for (let [key, state] of toChange)
        {
            this._keyStates.set(key, state);
        }
    }

    // Checks if a key is held
    getKey(key)
    {
        if (!this._keyStates.has(key))
            return false;
        else
            return this._keyStates.get(key) === KeyState.JUST_HELD
                || this._keyStates.get(key) === KeyState.HELD;
    }

    // Checks if a key was just pressed
    getKeyDown(key)
    {
        if (!this._keyStates.has(key))
            return false;
        else
            return this._keyStates.get(key) === KeyState.JUST_HELD;
    }

    // Checks if a key was just released
    getKeyUp(key)
    {
        if (!this._keyStates.has(key))
            return false;
        else
            return this._keyStates.get(key) === KeyState.JUST_RELEASED;
    }

    getAnyKeyDown()
    {
        for (let state of this._keyStates.values())
            if (state === KeyState.JUST_HELD)
                return true;
        return false;
    }

    _onkeydown(ev)
    {
        if (!this.getKey(ev.code))
            this._keyStates.set(ev.code, KeyState.JUST_HELD);
    }

    _onkeyup(ev)
    {
        this._keyStates.set(ev.code, KeyState.JUST_RELEASED);
    }
}
