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

However, if you don't care how your little machine does all the things for you,
hopefully I can at least convince you that the discussion and evolution of these algorithms is beautiful,
and applicable in many other algorithmic problem areas.

**Flashy parts of pathfinding algorithms**

# The general problem

On of the amazing things about discussing pathfinding algorithms
is that pathfinding is something we do multiple times a day, without assistance from technology,
and so its very intuitive to discuss topics here that might have seemed more abstract in a different problem domain.

The key difference here is that while we pathfind often on a very small scale,
we need fast computer algorithms to give us extremely optimal paths, or paths over incredibly large domain sizes.

While you might have a particular image of a pathfinding algorithm telling you whether to turn left or go straight at the lights, it does help to abstract the problem a little bit, so that we can use those same algorithms in surprisingly varied problem domains.

We'll define any pathfinding problem to contain two points of interest in a space:
A *start* point and an *end* goal.

We aim to begin at the start point, and via a process of movements between intermediate points, end up at the *end* goal.

We might modify this definition later, to include some more interesting problems (multiple starts, multiple goals, path weighting, etc.), but for now this is more than enough to discuss baby's first pathfinding algorithm :)

@[video][sectioned](assets/videos/test) {sections: [(0, 'Here is text 1'), (1.5, 'Now we are at part 2')]} (~
    Here's some **example** text
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

So let's do it! Let's get from A to B! I think it's first best to think how you'd approach this situation, and try as best you can to put that into algorithmic terms, using the queries mentioned above where  appropriate. Here's some flashing graphs, see what your brain first does when it tries to find a path between the red and green dots.

@[video][fullscreen](assets/videos/Pathfinding/flashing_graphs) (~
    There's lots of different graph types, aren't there?
~)

For me personally, when I first am flashed a graph like the ones above,
I kind of 'search out' from the start vertex. That is, I look at the vertices close to the start vertex,
then looking out a bit further, etc., until I find the end vertex.

Obviously my brain doesn't follow that to a tee,
but for smaller graphs that's where my mind wanders most of the time.

For a human, this might not make sense for increasingly big graphs, because we need to keep track of all of the current vertices we are looking at.
Let's not worry about this for now, and try and turn it into an algorithm!

## Formalizing

Rather than keeping these algorithms completely within our brains,
let's turn this into a set of simple and unambiguous steps.

First, we'll have the notion of vertices we are currently looking at.
We'll call these the `expanding` nodes (Still applicable here, but moreso because its related to later algorithms.)

The first algorithm we begin 'expanding' from is the start node

```python3
expanding = [graph.start]
```

Next, and most importantly, we need to formalise what we mean by 'searching out' is, and in what order we search out from vertices.

First of all, I think it's most reasonable to define 'searching out' as appending all of a vertex's neighbours to the `expanding` set (That haven't already been expanded).

After that, I think there are two natural ways to order the way we 'expand' these vertices:

1. Expand the vertices in zones dependant on distance from the start vertex. (Favouring Breadth of Search)
> More what I was describing with my approach
2. Keep expanding neighbours until we hit the end of a graph, then begin backtracking (Favouring Depth of Search)
> A good approach for testing whether a path exists, but maybe not for generating the shortest one.

I'm going to write up the answer for (1), but it'd be a good exercise to try the same for (2):

```python3
for vertex in graph:
    vertex.expanded = False
expanding = [graph.start]
while not graph.end.expanded:
    new_expanding = []
    for vertex in expanding:
        for neighbour in graph.expanding(vertex):
            if neighbour not in expanding and not neighbour.expanded:
                new_expanding.append(neighbour)
        vertex.expanded = True
    expanding = new_expanding
```
