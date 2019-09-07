# Why should I care?

It's hard to fathom how much we rely on computer algorithms to get around these days,
and how much computational pathfinding is built in to many of the problems we solve,
that aren't just 'get from here to there'.

Do you remember the days of Melways, and other obscenely large books, containing just maps of your local area?
There's obviously a reason those all seemed to vanish in a matter of years, and that's because
we now have a little device which tells where to go, with better accuracy and more knowledge
of the current road state than a book could ever encapsulate.

<div class="row" markdown="1">
<div class="col-md-6 col-xs-12">
    On the contrary, we've all seen times where this *reliance* on algorithms has served us poorly,
    or at the very least has confused us to see such a bad solution to a simple problem.
</div>
<div class="col-md-6 col-xs-12">
    <img src="https://media.giphy.com/media/8vzg9PiyeBGgAxAs6d/giphy.gif" />
</div>
</div>

But even if you don't care how your little machine does all the things for you,
hopefully I can at least convince you that the discussion and evolution of these algorithms is beautiful,
and applicable in many other algorithmic problem areas.

@[video][sectioned](assets/videos/Pathfinding/highlights) {sections: [(0, 'BFS Graphs'), (24, 'An Interesting Puzzle'), (34, 'Jump Point Search'), (45, 'LPA Star')]} (~

~)

# The general problem

One of the amazing things about discussing pathfinding algorithms
is that pathfinding is something we do multiple times a day, without assistance from technology,
and so it is very intuitive to discuss topics here that might have seemed more abstract in a different problem domain.

The key difference here is that while we pathfind often on a very small scale,
we need fast computer algorithms to give us extremely optimal paths, or paths over incredibly large domain sizes.

While you might have a particular image of a pathfinding algorithm telling you whether to turn left or go straight at the traffic lights, it does help to abstract the problem a little bit, so that we can use those same algorithms in surprisingly varied problem domains.

We'll define any pathfinding problem to contain two points of interest in a space:
A *start* point and an *end* goal.

We aim to begin at the start point, and via a process of movements between intermediate points, end up at the *end* goal.

We might modify this definition later, to include some more interesting problems (multiple starts, multiple goals, path weighting, etc.), but for now this is more than enough to discuss baby's first pathfinding algorithm :)

@[video][sectioned](assets/videos/Pathfinding/generic_graph) {sections: [(0, 'Start and End'), (5, 'Add Intermediate Points'), (9, 'The Wider Domain')]} (~
~)

From now on I'll call these 'points' *vertices* (*vertex* singular), and the connections between these *edges*.
This is because the current definition shares its likeness with mathematical graphs,
which has the same terminology.

When writing algorithms, most of the time the cheapest/easiest queries to make on such a graph will be:

* What are the start and end vertices?
* What are the neighbours of vertex `a`?
* What edge(s) can I uses to get from vertex `a` to `b`?

And so we'll write algorithms mostly in terms of these queries
(However I will try to keep away from code of any form,
most algorithms can be explained in plain english rather succinctly).

# Keep it Simple Stupid

## Natural Approach

So let's do it! Let's get from A to B! Let's first try to think how you'd approach this situation, and try as best you can to put that into algorithmic terms, using the queries mentioned above where  appropriate. Here are some flashing graphs, see what your brain first does when it tries to find a path between the red and green dots/squares.

@[video][fullscreen](assets/videos/Pathfinding/flashing_graphs) (~
    There's lots of different graph types, aren't there?
~)

For me personally, when I'm flashed a graph like the ones above,
I kind of 'search out' from the start vertex. That is, I look at the vertices close to the start vertex,
then looking out a bit further, etc., until I find the end vertex.

Obviously my brain doesn't follow that to a tee,
but for smaller graphs that's where my mind wanders most of the time.

For a human, this might not make sense for increasingly big graphs, because we need to keep track of all of the current vertices we are looking at.
Let's not worry about this for now, and try and turn it into an algorithm!

## Formalizing

Rather than keeping these algorithms completely within our brains,
let's turn this into a set of simple and unambiguous steps.

First, we'll have the notion of vertices we are currently looking at in the algorithm.
We'll call these the `expanding` vertex (Because we want to 'expand' our range of vision from the start vertex, but moreso because it is a term related to later algorithms.)

The first vertex we begin 'expanding' from is the start:

```python3
expanding = set(graph.start)
```

Next, and most importantly, we need to formalise what 'searching out' is, and in what order we search out from vertices.

First of all, I think it's most reasonable to define 'searching out' as appending all of a vertex's neighbours to the `expanding` set (At least those that we haven't already been expanded).

After that, I think there are two natural ways order our 'expansion' of these vertices:

1. Expand the vertices in zones dependant on distance from the start vertex. (Favouring Breadth of Search)
> More what I was describing with my approach
2. Keep expanding neighbours until we hit the end of a graph, then begin backtracking (Favouring Depth of Search)
> A good approach for testing whether a path exists, but maybe not for generating the shortest one.

***VIDEO Showing the breadth and depth approaches - USE COLOR.***

I'm going to write up the answer for (1), but it'd be a good exercise to try the same for (2):

```python3
for vertex in graph:
    vertex.expanded = False
expanding = set(graph.start)
while not graph.end.expanded:
    new_expanding = set()
    for vertex in expanding:
        vertex.expanded = True
    for vertex in expanding:
        for neighbour in graph.neighbours(vertex):
            if not neighbour.expanded:
                new_expanding.add(neighbour)
    expanding = new_expanding
```

So, to keep it in simple english, we first look at all vertices which are 0 distance from the start,
then 1 distance from the start, then 2 distance, and so on, until we find the end vertex.

We can generate all $n$-distance vertices from the graph, after knowing the $n-1$-distance vertices, by visiting all of their neighbours, and marking any that we haven't seen yet.

This is because the distance from the start between any two adjacent vertices is at most 1.
(Otherwise we'd be able to generate a shorter distance to the start vertex than we'd originally defined)

# Divining a path

So we can locate the end all well and good, but how do we create a path now that we've searched the entire way?

I'll pose two solutions here, each which assume some computation/memory has been going on as we've been searching the graph.

## Closing the distance

Rather than pathing from the start to the end, let's traverse the other way!
Let's assume that while we've been searching, we've been keeping track of the distance from the start vertex for each vertex we expand.

*This would be relatively simple, as we can just keep a counter in the *`while`* loop above.*

Next, I don't think its too much of a mental leap to say that a good path from the end to the start is one that always reduces the distance to the start vertex as you move across the path.

Such a path can always exist, and we can generate it algorithmically:

* Start at the end vertex.
* Look at all of the current vertex's neighbours
* There **must** be some neighbour where the distance from the start vertex decreases by 1 (*)
* Move to this new vertex
* Repeat back to the second step
* Once we reach a vertex with distance 0 from the start vertex, we must have reached the start vertex.

(*) The above is true because for there to be an $n$ length path from the start vertex to this one,
we must have an $n-1$ length path from the start vertex to one of its neighbours, followed by a 1 length path from that neighbour to our vertex.

This neighbour must have distance $n-1$, as if it was some $k < n-1$, then we'd have a $k + 1 < n$ length path from the start vertex to our vertex. (Drawing a diagram helps here if you are stuck)

## Remembering your roots

Let's instead say that as we are searching, each vertex remembers how it was discovered (What vertex in the previous iteration caused it to be `expanded`.)
We'll call this the vertex's `parent` (Because it gave 'birth' to this new vertex)

Then we can simply algorithmically generate a path from end to start by:

* Start at the end vertex.
* Move back to the current vertex's parent.
* Repeat until we hit the start vertex.

We are guaranteed to hit the start vertex, because that's where the entire search originated from.

# An unlikely application
## Introduction

Now that we've completed our first pathfinding algorithm (🎉 Woo! 🎉),
Lets take a break from the abstract and tackle a real problem.

One puzzle from the game [Professor Layton and the Curious Village](https://en.wikipedia.org/wiki/Professor_Layton_and_the_Curious_Village) (A *treasure trove* of algorithmically enticing puzzles) is as follows:

We have 3 chickens, and 3 wolves on one side of a river.
All of the animals want to reach the other side of the river, luckily they have a raft!

There are two main rules which restrict the solutions to this problem:

1. The raft only fits two animals at once (And there needs to be an animal on board for the raft to move)
2. If at any point either side of the river has more wolves than chickens, then the chickens get eaten!

Is there a set of moves that take all animals from one side of the river to the other?

@[video][fullscreen](assets/videos/Pathfinding/river_example) (~
    This problem pops up in a number of other areas, but I'm attributing it to this game so I have an excuse to use the nice artwork. Seriously play this game.
~)

## Where's the graph?

As a pathfinding problem, the solution doesn't exactly stick out immediately.
Sure the problem is asking for a path, but this path is just continual moves between two different places!
So what next? One thing I mentioned when we were first discussing pathfinding as a solution to other problems is that often times we need to abstract the solution to weird definitions of what a vertex and edge is, in order for our algorithms to be appropriate.

In this example, rather than thinking of our vertices as left and right of the river (Actual locations in the puzzle), let us think of each vertex we are moving to and from, to be a bit more specific.

It should encode the location of the wolves, chickens, as well as the raft into a single point.
This would ensure that two different *game states* are different, even if the raft is currently at the right side of the river in both.

One simple way would be to simply encode a string, where the first 3 characters would represent the wolf locations, the next three the chickens, and the last 1 the raft's location:

* LLR RRL R would mean 2 wolves and 1 chicken on the left, with the raft and the rest on the right
* RRR LLL L would mean wolves on the right, chickens on the left, raft on the left.

Notice how when we describe the encoding, we don't actually care which chicken/wolf is on which side, we only talk quantities. This is because the problem state isn't affected by the location of individual chickens, rather the rules are only affected by **how many** chickens/wolves there are on either side (As well as the raft).

So instead of encoding each chicken/wolf location, we can reduce the number of vertices greatly by simply decoding a game state to number how many chickens/wolves are on the left side, as well as how many rafts are on the left side (0 or 1):

* 210 would be equivalent to LLR RRL R (or LRL LRR R, or many others)
* 031 would be equivalent to RRR LLL L (and that is the only encoding in the previous schema)

Overall we've reduced our vertex amount from $2^7 = 128$ to $4 * 4 * 2 = 32$.
Now that we've got a tight definition of valid vertices, we can define an edge between two vertices to mean a valid transition between the two decoded states existing!

## Let's move these animals

Now, we can construct a solution to our problem by:

1. Constructing a graph describing the entire problem state and how we can move around it
2. Starting at vertex 331 (All on the left)
3. Using our previous algorithm to pathfind to vertex 000 (All on the right)
4. Decode such a path into actual movements in the puzzle

*Note that vertex 001 would technically also satisfy a solution, but is unreachable.*

So let's do it! Let's construct the graph based on our previous rules.
First, we'll remove any vertices whose state violates rule 2 (More wolves than chickens),
then we'll add edges which are valid state transitions ($0 < x \leq 2$ animals changing, raft direction changes).
And lastly, we apply our algorithm!

@[video][sectioned](assets/videos/Pathfinding/pathfind_river) {sections: [(0, 'Generate States'), (16, 'Apply Rule 2'), (17, 'Add edges based on Rule 1'), (19, 'Find a solution!')]} (~

~)

This gives us that path 331 -> 220 -> 321 -> 300 -> 311 -> 110 -> 221 -> 020 -> 031 -> 010 -> 111 -> 000,
Which we can decode to:

* Send over a chicken and wolf
* Take back a chicken
* Send over the last 2 wolves
* Take back 1 wolf
* Send over 2 chickens
* Take back a chicken and wolf
* Send over 2 chickens
* Take back a wolf
* Send over two wolves
* Take back a chicken (or a wolf)
* Send over the remaining wolf and chicken/wolf

And there we have it! We've found a solution (and also concluded that there are really only 4 valid and short options) to the problem! (🎉 Double Woo! 🎉)

I think it is important to note that your abstraction has a big effect on how easy or hard a problem becomes.
As a good example, here is what our graph, and subsequent solution, looks like if we use the first encoding we came up with, with 4 times the vertices at first:

***VIDEO shitty pathfinding example. Enjoy compiling!***

In the next post on this I'm aiming to add edge weights into the mix, and alter our natural method into one of the most popular algorithms, period - Dijkstra's Algorithm!
