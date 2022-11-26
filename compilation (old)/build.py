#!/usr/bin/env python3

import importlib.util
import os.path
from jinja_utils import compile_template_with_url
from markdown_utils import compile_md_to_string

# Top level pages
for top_level_file in os.listdir("source"):
    full_path = os.path.join("source", top_level_file)
    if os.path.isfile(full_path):
        url = top_level_file.replace(".html", "")
        if top_level_file == "index.html":
            url = "/"
        with open(os.path.join("compiled", top_level_file), "w") as f:
            f.write(compile_template_with_url(top_level_file, url))


def path_import(absolute_path):
    """Implementation taken from https://docs.python.org/3/library/importlib.html#importing-a-source-file-directly"""
    spec = importlib.util.spec_from_file_location(absolute_path, absolute_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# Posts
for root, dirs, files in os.walk("source", topdown=False):
    for name in files:
        if name == "info.py":
            break
    else:
        continue
    post = path_import(os.path.join(root, "info.py")).Post()

    new_filepath = os.path.join("compiled", (root + ".html").replace("source/", ""))
    directory = os.path.dirname(new_filepath)
    if not os.path.exists(directory):
        os.makedirs(directory)
    with open(new_filepath, "w") as f:
        content = compile_md_to_string(os.path.join(root, "content.md"))
        post.content = content
        f.write(compile_template_with_url("includes/post.html", post.url, post=post))
