# A weighty decision

In the previous post, we formalised a simple algorithm that should give us the shortest number of edges to traverse a graph. Extremely useful, and pretty to look at, but no doubt limited.

The main difference between the problems we can solve now, and the problems that a maps app will solve, is that certain paths/edges in a map take more effort/time to traverse than others, and our algorithm doesn't take this into account. For example, in the following two graphs, there is a disconnect between what is the least edges path, and the least distance path.

@[video][fullscreen](assets/videos/Pathfinding/distance_differing) (~
    Even having octal directions of movement forces our algorithm to fail on a simple tiling map!
~)

So how can we fix our previous algorithm to cover this outcome?
There are a number simple patchwork methods to try transform this harder problem into a version suitable for our original solution. For example, if all edge weights are whole numbers, then we can separate a long edge into a long chain of vertices.

@[video][sectioned](assets/videos/Pathfinding/graph_mappings) { sections: [(0, 'Decompose edges'), (1, 'Irrational edge decomposition')] } (~

~)

But for any given bit of patchwork, you can always give some graph representation for which this fails.
This is because adding edge weights simply makes this a harder problem to solve, and we need a heavy duty algorithm to tackle this problem. That being said the concept itself isn't too hard to grasp.

And that's not to say we have to throw out our old algorithm entirely, in fact we really just need to make one change.

Let's take a closer look at how our algorithm performs on these new graphs. The reason our algorithm worked before was because we expanded vertices in order of increasing distance from the start vertex (However for us distance only meant number of edges). The problem now is that expanding all of the neighbours of a vertex at once doesn't quite make sense, as some neighbours are closer than others.

This difference in approach means that we don't consider vertices in order of distance anymore, as you can see below:

@[video][fullscreen](assets/videos/Pathfinding/BFS_distance_order) (~

~)

So how can we remedy this? Let's assume (rather reasonably, I hope) that every edge weight here is positive, as with normal roads.

Rather than trying to find the entire ordering of the graph distances, let's try to think what the closest vertex to the start vertex is, by total distance:

@[video][fullscreen](assets/videos/Pathfinding/closest_vertex)(~
    Do you see the pattern?
~)

As you hopefully see; The closest vertex always has to be a neighbour of the start vertex! This is because any path from the start vertex to any other vertex has to include an edge from the start vertex to one of it's neighbours, so obviously one of these neighbours must be the closest.
Moreover, the neighbour closest must have the smallest edge weight between it and the start vertex, by similar reasoning.

Great, we're one step of the way! What about the second closest?
Well, using similar logic to above, we can deduce that the path between this next shortest vertex and the start vertex must pass through one of the neighbours of the start vertex:

* If that neighbour isn't the closest vertex to the start, then this neighbour is the second closest
> This is because the path from the start to this neighbour is definitely shorter than the any other path which passes through both the neighbour and the start vertex.
* If that neighbour is the closest vertex to the start, then a neighbour of the closest vertex is the second closest
> This is due to similar logic to deducing the closest was a neighbour of the start.

In general, if we denote $T_n$ to be subgraph of the $n^{\text{th}}$ closest vertices to the start (including the start vertex itself), then we know the $(n+1)^{\text{th}}$ closest vertex must share an edge with some vertex in $T_{n}$. If this was not, the case, then the path from this new vertex to the start vertex could be shortened to some other vertex not in $T_n$:

@[video][sectioned](assets/videos/Pathfinding/nth_closest_proof) { sections: [(0, 'Generate $T_n$'), (1, 'Take some $x_{n+1}$ not neighbouring'), (2, 'Improve $x_{n+1}$')] } (~

~)

Therefore, we are guaranteed to find each vertex in increasing distance while only looking at those adjacent to our currently expanding vertices. As such we don't need to change our original algorithm much, but just the order in which we expand vertices, namely **Expand in order of increasing distance from the start vertex.**.
