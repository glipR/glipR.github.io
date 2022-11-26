from objects import Post as BasePost
from datetime import date


class Post(BasePost):

    title = "Computers from A to B"
    description = "Modifying our algorithm for edge weights"

    url = "Pathfinding/Dijkstra"

    last_updated = date(2019, 9, 18)
