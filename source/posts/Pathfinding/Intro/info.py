from objects import Post as BasePost

class Post(BasePost):

    title = 'Pathfinding'
    description = 'How computers get you from A to B'

    url = title + '/' + 'Intro'
