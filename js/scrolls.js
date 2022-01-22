function setScrolls(show) {
    const el = document.getElementsByClassName("toppanel-content");
    for (var i=0; i<el.length; i++) {
        el[i].scrollTo(0, 0);
        if (el[i].parentElement.id == show) {
            el[i].parentElement.hidden = false;
        } else {
            el[i].parentElement.hidden = true;
        }
    }
}
window.onload = ()=>{setScrolls("nothing")};