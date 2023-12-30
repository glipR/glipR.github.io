function addTutorOnlicks() {
    const el = document.getElementsByClassName("teaching-box");

    for (var i=0; i<el.length; i++) {
        var box = el[i];
        box.onclick = (ev) => {
            var cur = ev.originalTarget;
            while (!cur.classList.contains("teaching-box")) {
                cur = cur.parentElement;
            }
            const blurb = cur.getElementsByClassName("teaching-box-blurb")[0];
            const info = cur.getElementsByClassName("teaching-box-info")[0];
            const blurbStyle = getComputedStyle(blurb);
            const infoStyle = getComputedStyle(info);
            blurb.style.opacity = 1 - blurbStyle.opacity;
            info.style.opacity = 1 - infoStyle.opacity;
        }
    }

}
window.onload = ()=>{addTutorOnlicks()};
