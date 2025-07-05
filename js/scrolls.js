function setScrolls(show) {
    const el = document.getElementsByClassName("toppanel-content");
    for (var i=0; i<el.length; i++) {
        if (el[i].parentElement.parentElement.id == show) {
            el[i].parentElement.parentElement.hidden = false;
        } else {
            if (show != "none")
                el[i].parentElement.parentElement.hidden = true;
        }
    }
    for (var i=0; i<el.length; i++) {
        el[i].scrollTo(0, 0);
        if (show != "none") {
            const targetElement = document.getElementById(show);
            if (targetElement) {
                setTimeout(()=>{targetElement.scrollIntoView({behavior: 'smooth'})}, 100)
            }
        } else {
            setTimeout(()=>{window.scroll(0, 0)}, 100)
        }
    }
}
window.onload = ()=>{setScrolls("none")};
