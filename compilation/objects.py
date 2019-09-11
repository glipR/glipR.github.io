class Post(object):

    title = 'blog.glipr.dev'
    description = 'What goes here lol'

    @property
    def url(self):
        return self.title
