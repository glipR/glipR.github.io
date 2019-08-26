import copy
import markdown
import os.path
import re
from textwrap import dedent


class PTagCleanup(markdown.postprocessors.Postprocessor):

    def run(self, text):
        return re.sub(
            r'<span([^>]*)></p>',
            r'<span\1>',
            text.replace('<p></span>', '</span>'),
        )

class CustomBlockProcessor(markdown.blockprocessors.BlockProcessor):
    """A custom block to be wrapped in custom HTML."""

    start_defn = None

    options_re = r'(\{(?P<options>.*)\})?'
    start_id = r'\(~'
    end_id = r'~\)'

    option_matcher = re.compile(r'\s*(?P<key>\S+)\s*:\s*(?P<value>(\s*[^\[]\S+[^\]]\s*)|\[(.*)\])\s*')
    default_options = {
        'numbering': True,
    }

    remove_indent = True
    remove_end_match = True
    content_together = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.block_number = 1
        self.block_data = {}

    @property
    def start_matcher(self):
        return re.compile(
            self.start_defn + r'\s*' +
            self.options_re + r'\s*' +
            self.start_id
        )

    @property
    def end_matcher(self):
        return re.compile(self.end_id)

    def get_before_content(self, block_data, block_number):
        raise NotImplementedError()

    def get_after_content(self, block_data, block_number):
        raise NotImplementedError()

    def map_inner_content(self, string, block_data, block_number):
        if self.remove_indent:
            string = '\n'.join(self.detab(string))
        return string

    def split_and_recombine(self, blocks):
        new_blocks = [[]]
        for line in '\n\n'.join(blocks).split('\n'):
            if line:
                new_blocks[-1].append(line)
            else:
                new_blocks.append([])
        return [
            '\n'.join(s)
            for s in new_blocks
            if s
        ]

    def test(self, parent, block):
        start_match = self.start_matcher.match(block)
        if start_match is not None:
            self.block_data = start_match.groupdict()
            self.options = copy.copy(self.default_options)
            options = self.option_matcher.findall(self.block_data.get('options', '') or '')
            for key_and_value in self.option_matcher.findall(self.block_data.get('options', '') or ''):
                # could have multiple matches, so pick the largest rather than assuming 1:
                self.options[key_and_value[0]] = eval(key_and_value[1])
            return True
        return False

    def run(self, parent, blocks):
        # Beginning content
        starting_block = blocks[0]
        if self.content_together:
            before = self.get_before_content(self.block_data, self.block_number)
            skip_amount = len(before.split('\n'))
            blocks[0] = before + '\n'.join(starting_block.split('\n')[1:])
        else:
            blocks[0] = '\n'.join(starting_block.split('\n')[1:])
            blocks.insert(0, self.get_before_content(self.block_data, self.block_number))
        for index in range(0, len(blocks)):
            if index == 0:
                if not self.content_together:
                    skip_amount = 0
                enumeration = enumerate(blocks[index].split('\n')[skip_amount + 1:])
            else:
                enumeration = enumerate(blocks[index].split('\n'))
            for secondary_index, line in enumeration:
                end_match = self.end_matcher.match(line)
                if end_match is not None:
                    ending_block = self.map_inner_content(
                        '\n'.join(blocks[index].split('\n')[:secondary_index]),
                        self.block_data,
                        self.block_number,
                    )
                    blocks.insert(index + 1, '\n'.join(blocks[index].split('\n')[secondary_index + 1:]))
                    if not self.remove_end_match:
                        blocks.insert(index + 1, line)
                    if self.content_together:
                        blocks[index-1] = blocks[index-1] + self.get_after_content(self.block_data, self.block_number)
                    else:
                        blocks.insert(index + 1, self.get_after_content(self.block_data, self.block_number))
                    blocks[index] = ending_block
                    for index2, block in enumerate(blocks[:index+2]):
                        blocks[index2] = block.rstrip()
                    new_blocks = self.split_and_recombine(blocks[:index+2])
                    for index2 in range(index+1, -1, -1):
                        del blocks[index2]
                    for block in reversed(new_blocks):
                        blocks.insert(0, block)
                    break
            else:
                blocks[index] = self.map_inner_content(
                    blocks[index],
                    self.block_data,
                    self.block_number,
                )
                continue
            break
        else:
            print(f'Parsing error! No end found for {self.__class__.__name__}.')
            if self.content_together:
                blocks[-1] = blocks[-1] + self.get_after_content(self.block_data, self.block_number)
            else:
                blocks.append(self.get_after_content(self.block_data, self.block_number))
            new_blocks = self.split_and_recombine(blocks)
            for index in range(len(blocks)-1, -1, -1):
                del blocks[index]
            for block in reversed(new_blocks):
                blocks.insert(0, block)

        if self.options.get('numbering', True):
            self.block_number += 1


class VideoProcessor(CustomBlockProcessor):

    start_defn = r'@\[video\]\[(?P<type>\S+)\]\((?P<path>\S+)\)'

    TYPE_FULLSCREEN = 'fullscreen'
    TYPE_SECTIONED = 'sectioned'

    TYPES = (
        TYPE_FULLSCREEN,
        TYPE_SECTIONED,
    )

    def video_div(self, block_data, block_number):
        return dedent("""\
            <video id='%s' class='video-js vjs-default-skin vjs-fluid vjs-big-play-centered' controls preload='auto'>
                <source src='%s' type='video/mp4' label="%s" selected="true">
                <source src='%s' type='video/mp4' label="%s">
                <p class='vjs-no-js'>
                    To view this video please enable JavaScript, and consider upgrading to a web browser that
                    <a href='https://videojs.com/html5-video-support/' target='_blank'>supports HTML5 video</a>
                </p>
            </video>\
        """ % (
            'video_%s' % block_number,
            '/' + os.path.join(block_data['path'], '480p.mp4'),
            '480p',
            '/' + os.path.join(block_data['path'], '1440p.mp4'),
            '1440p',
        ))

    def get_before_content(self, block_data, block_number):
        # Split on video type here.
        if block_data["type"] == self.TYPE_FULLSCREEN:
            return self.video_div(block_data, block_number) + dedent("""\
                <span class="video_description" markdown="1">\
            """)
        elif block_data["type"] == self.TYPE_SECTIONED:
            return (
                "<div class='row'><div class='col-md-9 col-xs-12'>" +
                self.video_div(block_data, block_number) +
                "</div>" +
                "<div class='col-md-3 col-xs-12'>%s</div>" % (
                    self.section_div(time, title)
                    for time, title in self.options['sections']
                )
            )

    def section_div(self, time, title):
        return "<div class='section_choice' data_time='%s'><p>%s</p></div>" % (time, title)

    def get_after_content(self, block_data, block_number):
        return dedent("""\
            </span>\
        """)


class MyExtension(markdown.extensions.Extension):
    def __init__(self, *args, **kwargs):
        self.relative_path = kwargs.pop('relative_path', None)
        super().__init__(*args, **kwargs)

    block_processors = [
        (VideoProcessor, 5000),
    ]

    post_processors = [
        (PTagCleanup, -1),
    ]

    def extendMarkdown(self, md):
        for processor, priority in self.block_processors:
            p = processor(md.parser)
            p.relative_path = self.relative_path
            md.parser.blockprocessors.register(p, processor.__name__, priority)
        for processor, priority in self.post_processors:
            p = processor(md)
            p.relative_path = self.relative_path
            md.postprocessors.register(p, processor.__name__, priority)


def compile_md_to_string(filename):
    with open(filename, 'r') as f:
        content = f.read()
        relative_path = os.path.dirname(filename)
        content = markdown.markdown(content, extensions=[
            'codehilite',
            'attr_list',
            'extra',
            MyExtension(relative_path=relative_path),
        ])
        return content
