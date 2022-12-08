let lcinst;

window.onload = () => {
    let addr = document.getElementById("address");
    addr.oninput = () => {
        lcinst.setSocketAddress(addr.value);
    };
    addr.onkeydown = (e) => {
        if (e.key === "Enter") {
            lcinst.connectSocket();
        }
    };

    let lcelem = document.getElementsByClassName("lc")[0];
    lcinst = LCInstance.run(512, 512, lcelem, addr.value);
};
