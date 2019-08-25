class Post(object):

    title = 'blog.glipr.dev'
    description = 'Ramblings of a naive developer'

    @property
    def url(self):
        return self.title
