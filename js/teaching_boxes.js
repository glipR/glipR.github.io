function addTutorOnlicks() {
    const el = document.getElementsByClassName("teaching-box");

    for (var i=0; i<el.length; i++) {
        var box = el[i];
        box.onclick = (ev) => {
            // Prevent carousel from interfering
            ev.preventDefault();
            ev.stopPropagation();

            var cur = ev.target || ev.srcElement; // Use standard target property with fallback
            while (!cur.classList.contains("teaching-box")) {
                cur = cur.parentElement;
                if (!cur) return; // Safety check to prevent infinite loop
            }
            const blurb = cur.getElementsByClassName("teaching-box-blurb")[0];
            const info = cur.getElementsByClassName("teaching-box-info")[0];

            if (blurb && info) {
                const blurbStyle = getComputedStyle(blurb);
                const infoStyle = getComputedStyle(info);
                blurb.style.opacity = 1 - parseFloat(blurbStyle.opacity);
                info.style.opacity = 1 - parseFloat(infoStyle.opacity);
            }
        }
    }

}
window.onload = ()=>{addTutorOnlicks()};
