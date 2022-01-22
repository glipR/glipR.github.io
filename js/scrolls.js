function setScrolls() {
    const el = document.getElementsByClassName("toppanel-content");
    for (var i=0; i<el.length; i++) {
        el[i].scrollTo(0, 0);
    }
}