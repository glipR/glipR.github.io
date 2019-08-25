#!/usr/bin/env python3

import os
from jinja_utils import compile_template_with_url

for top_level_file in os.listdir('source'):
    full_path = os.path.join('source', top_level_file)
    if os.path.isfile(full_path):
        url = top_level_file.replace('.html', '')
        if top_level_file == 'index.html':
            url = '/'
        with open(os.path.join('compiled', top_level_file), 'w') as f:
            f.write(compile_template_with_url(top_level_file, url))
