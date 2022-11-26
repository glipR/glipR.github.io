from objects import Post as BasePost
from datetime import date


class Post(BasePost):

    title = "Computers from A to B"
    description = "An introduction and Natural Search Algorithms"

    url = "Pathfinding/Intro"

    last_updated = date(2019, 9, 11)
