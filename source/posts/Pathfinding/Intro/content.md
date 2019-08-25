# Why should I care?

It's hard to fathom how much we rely on computer algorithms to get around these days,
and how much computational pathfinding is built in to many of the problems we solve,
that aren't just 'get from here to there'.

Do you remember the days of Melways, and other obscenely large books, containing just maps of your local area?
There's obviously a reason those all seemed to vanish in a matter of years, and that's because
we now have a little device which tells where to go, with better accuracy and more knowledge
of the current road state than a book could ever encapsulate.

*Split me into a half page? For desktop view, mobile should still see me 1 by 1*
On the contrary, we've all seen times where this reliance on algorithms has served us **GIF**poorly.

However, if you don't care how your little machine does all the things for you,
hopefully I can at least convince you that the discussion and evolution of these algorithms is beautiful,
and applicable in many other algorithmic problem areas.

**Flashy parts of pathfinding algorithms**

# The general problem

On of the amazing things about discussing pathfinding algorithms
is that pathfinding is something we do multiple times a day, without assistance from technology,
and so its very intuitive to discuss topics here that might have seemed more abstract in a different problem domain.

While you might have a particular image of a pathfinding algorithm telling you whether to turn left or go straight at the lights, it does help to abstract the problem a little bit, so that we can use those same algorithms in surprisingly varied problem domains.

We'll define any pathfinding problem to contain two points of interest in a space:
A *start* point and an *end* goal.

We aim to begin at the start point, and via a process of movements between intermediate points, end up at the *end* goal.

We might modify this definition later, to include some more interesting problems (multiple starts, multiple goals, path weighting, etc.), but for now this is more than enough to discuss baby's first pathfinding algorithm :)

**Video of graph definition**
