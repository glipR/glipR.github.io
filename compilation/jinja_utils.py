from jinja2 import Environment, FileSystemLoader, select_autoescape

env = Environment(
    loader=FileSystemLoader('.'),
    autoescape=select_autoescape(['html', 'xml']),
)

# template = env.get_template('includes/test_compilation.html')

# print(template.render(article='test'))
