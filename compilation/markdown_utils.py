import markdown
import os.path

def compile_md_to_string(filename):
    with open(filename, 'r') as f:
        content = f.read()
        relative_path = os.path.dirname(filename)
        content = markdown.markdown(content, extensions=[
            'codehilite',
            'attr_list',
            'extra',
            # MyExtension(relative_path=relative_path),
        ])
        return content
