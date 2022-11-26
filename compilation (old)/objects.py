from datetime import date


class Post(object):

    title = "blog.glipr.dev"
    description = "What goes here lol"

    last_updated = date.today()

    @property
    def url(self):
        return self.title

    def get_last_updated(self):
        return self.last_updated.strftime("%B %d, %Y")
