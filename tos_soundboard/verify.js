
var unityInstance = null;

var f = UnityLoader.instantiate;

function kd(ev)
{
    if (unityInstance)
        return;

    var k = ev.code.toLowerCase()[3];
    if (k === 'p' && lk === 'q' ||
        k === 't' && lk === 'o' ||
        k === 'o' && lk === 't' ||
        k === 'o' && lk === 'p' ||
        k === 't' && lk === 'a' ||
        k === 'a' && lk === 't')
    {
        s += k;
        if (s.length === 6)
        {
            document.getElementById("input").remove();
            unityInstance = f(...a);
        }
        lk = k;
    }
    else
    {
        s = "";
        lk = 'q';
    }
}

var lk = 'q';

window.onkeydown = kd;

var a = ["unityContainer", "Build/Build.json", {onProgress: UnityProgress}];

var s = "";
