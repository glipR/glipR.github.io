from jinja2 import Environment, FileSystemLoader, select_autoescape
from objects import Post

env = Environment(
    loader=FileSystemLoader("source"),
    autoescape=select_autoescape(["html", "xml"]),
)


def compile_template_with_url(path, url, post=None, **options):
    post = post or Post()
    template = env.get_template(path)
    return template.render(url=url, local_link=url, post=post, **options)
