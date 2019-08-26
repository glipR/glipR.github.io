// Custom Stuff

const options = {
    controlBar: {
        children: [
            'playToggle',
            'progressControl',
            'volumePanel',
            'qualitySelector',
            'fullscreenToggle',
        ],
    },
    fluid: true,
};

const videos = {};

$('video').each(function() {
    const _id = $(this).attr('id');
    var player = videojs(_id, options);
    videos[_id] = player;
});

// Github Pages Theme by @mattgraham(https://twitter.com/michigangraham)
// For auto-generating section height and sidebar links.
var sectionHeight = function() {
    var total    = $(window).height(),
        $section = $('section').css('height','auto');

    if ($section.outerHeight(true) < total) {
        var margin = $section.outerHeight(true) - $section.height();
        $section.height(total - margin - 20);
    } else {
        $section.css('height','auto');
    }
}

$(window).resize(sectionHeight);

$(function() {
    $("section h1, section h2, section h3").each(function(){
        $("nav ul").append("<li class='tag-" + this.nodeName.toLowerCase() + "'><a href='#" + $(this).text().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g,'') + "'>" + $(this).text() + "</a></li>");
        $(this).attr("id",$(this).text().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g,''));
        $("nav ul li:first-child a").parent().addClass("active");
    });

    $("nav ul li").on("click", "a", function(event) {
        var position = $($(this).attr("href")).offset().top - 190;
        $("html, body").animate({scrollTop: position}, 400);
        $("nav ul li a").parent().removeClass("active");
        $(this).parent().addClass("active");
        event.preventDefault();
    });

    sectionHeight();

    $('img').on('load', sectionHeight);
});

$('.section_div').each(function () {
    top_div = $(this);
    $(this).find('.section_choice').click(function () {
        const video_id = top_div.find('.video-js').attr('id');
        const player = videos[video_id];
        player.currentTime($(this).attr('data_time'));
    })

});

setInterval(function() {
    $('.section_div').each(function () {
        top_div = $(this);
        const video_id = top_div.find('.video-js').attr('id');
        const player = videos[video_id];
        const time = player.currentTime();
        const available_sections = [];
        $('.section_choice').removeClass('selected')
        top_div.find('.section_choice').each(function () {
            if ($(this).attr('data_time') <= time) {
                available_sections.push($(this));
            }
        });
        if (available_sections.length) {
            available_sections[available_sections.length - 1].addClass('selected');
        }
    });
}, 100);
