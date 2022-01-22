function setScrolls(show) {
    const el = document.getElementsByClassName("toppanel-content");
    for (var i=0; i<el.length; i++) {
        if (el[i].parentElement.id == show) {
            el[i].parentElement.hidden = false;
        } else {
            el[i].parentElement.hidden = true;
        }
    }
    for (var i=0; i<el.length; i++) {
        el[i].scrollTo(0, 0);
        window.scroll(0, document.body.scrollHeight)
    }
}
window.onload = ()=>{setScrolls("nothing")};