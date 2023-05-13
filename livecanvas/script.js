window.onload = () => {
    let lcelem = document.getElementsByClassName("lc")[0];
    lcinst = LCInstance.run(lcelem, "wss://livecanvas.gaf.wtf/ws");
};
