#!/usr/bin/env python3

import argparse
import copy
import markdown
import os
import re
from textwrap import dedent

## Custom Markdown Compilation


class NewTabLink(markdown.postprocessors.Postprocessor):
    def run(self, text):
        return re.sub("<a href=", '<a target="_blank" href=', text)


class CodeIncluder(markdown.blockprocessors.BlockProcessor):
    """
    Expands @[code_include][<language>](<filename>) into a codeblock,
    with the content equal to the contents of filename, with the language specified.
    """

    matcher = re.compile(r"@\[code_include\]\[(?P<lang>\S+)\]\((?P<path>\S+)\)")

    def test(self, parent, block):
        match = self.matcher.match(block)
        if match is not None:
            self.block_data = match.groupdict()
            return True
        return False

    def run(self, parent, blocks):
        lines = blocks[0].split("\n")
        blocks[0] = "\n".join(lines[1:])

        file_location = os.path.join(self.relative_path, self.block_data["path"])
        if not os.path.isfile(file_location):
            raise ValueError(f"Could not locate code snippet at path: {file_location}")
        with open(file_location, "r") as f:
            code = f.read()
            formatted = dedent(
                """\
                :::%s
                %s\
                """
                % (
                    self.block_data["lang"],
                    ("\n" + "    " * 4).join(
                        code.strip().split("\n")
                    ),  # This ensures everything is at the same indent.
                )
            )
            # Add a tab to ensure it's treated as a code block.
            formatted = "    " + "\n    ".join(formatted.split("\n"))
            blocks.insert(0, formatted)


class CustomBlockProcessor(markdown.blockprocessors.BlockProcessor):
    """A custom block to be wrapped in custom HTML."""

    start_defn = None

    options_re = r"(\{(?P<options>.*)\})?"
    start_id = r"\(~"
    end_id = r"~\)"

    option_matcher = re.compile(r"\s*(?P<key>\S+)\s*:\s*(?P<value>\S+)\s*")
    default_options = {
        "numbering": True,
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
            self.start_defn + r"\s*" + self.options_re + r"\s*" + self.start_id
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
            string = "\n".join(self.detab(string))
        return string

    def split_and_recombine(self, blocks):
        new_blocks = [[]]
        for line in "\n\n".join(blocks).split("\n"):
            if line:
                new_blocks[-1].append(line)
            else:
                new_blocks.append([])
        return ["\n".join(s) for s in new_blocks if s]

    def test(self, parent, block):
        start_match = self.start_matcher.match(block)
        if start_match is not None:
            self.block_data = start_match.groupdict()
            self.options = copy.copy(self.default_options)
            for key, value in self.option_matcher.findall(
                self.block_data.get("options", "") or ""
            ):
                self.options[key] = eval(value)
            return True
        return False

    def run(self, parent, blocks):
        # Beginning content
        starting_block = blocks[0]
        if self.content_together:
            before = self.get_before_content(self.block_data, self.block_number)
            skip_amount = len(before.split("\n"))
            blocks[0] = before + "\n".join(starting_block.split("\n")[1:])
        else:
            blocks[0] = "\n".join(starting_block.split("\n")[1:])
            blocks.insert(
                0, self.get_before_content(self.block_data, self.block_number)
            )
        for index in range(0, len(blocks)):
            if index == 0:
                if not self.content_together:
                    skip_amount = 0
                enumeration = enumerate(blocks[index].split("\n")[skip_amount + 1 :])
            else:
                enumeration = enumerate(blocks[index].split("\n"))
            for secondary_index, line in enumeration:
                end_match = self.end_matcher.match(line)
                if end_match is not None:
                    ending_block = self.map_inner_content(
                        "\n".join(blocks[index].split("\n")[:secondary_index]),
                        self.block_data,
                        self.block_number,
                    )
                    blocks.insert(
                        index + 1,
                        "\n".join(blocks[index].split("\n")[secondary_index + 1 :]),
                    )
                    if not self.remove_end_match:
                        blocks.insert(index + 1, line)
                    if self.content_together:
                        blocks[index - 1] = blocks[index - 1] + self.get_after_content(
                            self.block_data, self.block_number
                        )
                    else:
                        blocks.insert(
                            index + 1,
                            self.get_after_content(self.block_data, self.block_number),
                        )
                    blocks[index] = ending_block
                    for index2, block in enumerate(blocks[: index + 2]):
                        blocks[index2] = block.rstrip()
                    new_blocks = self.split_and_recombine(blocks[: index + 2])
                    for index2 in range(index + 1, -1, -1):
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
            print(f"Parsing error! No end found for {self.__class__.__name__}.")
            if self.content_together:
                blocks[-1] = blocks[-1] + self.get_after_content(
                    self.block_data, self.block_number
                )
            else:
                blocks.append(
                    self.get_after_content(self.block_data, self.block_number)
                )
            new_blocks = self.split_and_recombine(blocks)
            for index in range(len(blocks) - 1, -1, -1):
                del blocks[index]
            for block in reversed(new_blocks):
                blocks.insert(0, block)

        if self.options.get("numbering", True):
            self.block_number += 1


class OutputColorer(CustomBlockProcessor):
    """
    Colors output based on some simple coloring rules:
        >>> gets wrapped in 'k'-span
        <in></in> expands to <span class="mi"></span>

    Example:
        :::output
        >>> What's your name? <in>Richard</in>
        >>> Hello Richard! I'm the markdown compiler!
    """

    start_matcher = re.compile(r"\s*:::output")
    end_matcher = re.compile(r"^(\S+)|(\s*:::)|(^\s*$)")

    content_together = True

    remove_indent = False
    remove_end_match = False

    def map_inner_content(self, string, block_data, block_number):
        string = super().map_inner_content(string, block_data, block_number)
        if string.startswith("<div"):
            string = string.replace("    ", "", 1)
        new_lines = []
        for line in string.split("\n"):
            if line.startswith("    "):
                new_lines.append(line[4:])
            elif line.startswith("\t"):
                new_lines.append(line[1:])
            else:
                new_lines.append(line)
        string = "\n".join(new_lines)
        string = re.sub(
            r"#(.*)(\n|$)",
            r'<span class="c1">#\1</span>\2',
            string,
        )
        if string.startswith(">>>"):
            string = string.replace(">>>", '<span class="k">>>></span>', 1)
        return re.sub(
            r"<in>(.*)</in>",
            r'<span class="mi">\1</span>',
            (
                string.replace("\n>>>", '\n<span class="k">>>></span>').replace(
                    ">>>>", '><span class="k">>>></span>', 1
                )
            ),
        )

    def get_before_content(self, block_data, block_number):
        return '<div class="codehilite"><pre>'

    def get_after_content(self, block_data, block_number):
        return "</pre></div>"


class TaskProcessor(CustomBlockProcessor):
    """
    Expands @[task][<mins>][<title>](md content) into a task, setting classes,
    and incrementing the task counter correctly.
    """

    start_defn = r"@\[task\]\[(?P<minutes>.*)\]\[(?P<title>.*)\]"

    default_options = {
        "numbering": True,
        "just_title": False,
        "open": True,
        "show_mins": True,
    }

    def get_before_content(self, block_data, block_number):
        return dedent(
            """\
        <details class="task block" %s markdown="1"><summary>%s</summary>\
        """
            % (
                ("open" if self.options["open"] else ""),
                self.get_summary(block_data, block_number),
            )
        )

    def get_summary(self, block_data, block_number):
        title = (
            "%s (%s mins)" % (block_data["title"], block_data["minutes"])
            if self.options["show_mins"]
            else block_data["title"]
        )
        if self.options["just_title"]:
            return title
        elif not self.options["numbering"]:
            return "**Task** - %s" % title
        return "**Task %d** - %s" % (
            block_number,
            title,
        )

    def get_after_content(self, block_data, block_number):
        return """</details>"""


class CheckpointProcessor(CustomBlockProcessor):
    """
    Expands @[task][<mins>][<title>](md content) into a task, setting classes,
    and incrementing the task counter correctly.
    """

    default_options = {
        "numbering": True,
        "just_title": False,
        "open": True,
        "show_mins": True,
    }

    start_defn = r"@\[checkpoint\]\[(?P<minutes>\d+)\]\[(?P<title>.*)\]"

    def get_before_content(self, block_data, block_number):
        return dedent(
            """\
        <details class="checkpoint block" %s markdown="1"><summary>%s</summary>\
        """
            % (
                ("open" if self.options["open"] else ""),
                self.get_summary(block_data, block_number),
            )
        )

    def get_summary(self, block_data, block_number):
        title = (
            "%s (%s mins)" % (block_data["title"], block_data["minutes"])
            if self.options["show_mins"]
            else block_data["title"]
        )
        if self.options["just_title"]:
            return title
        elif not self.options["numbering"]:
            return "**Checkpoint** - %s" % title
        return "**Checkpoint %d** - %s" % (
            block_number,
            title,
        )

    def get_after_content(self, block_data, block_number):
        return """</details>"""


class NoteProcessor(CustomBlockProcessor):
    """
    Expands @[note][title](md content) into a note, setting classes,
    and incrementing the note counter correctly.
    """

    start_defn = r"@\[note\]\[(?P<title>.*)\]"
    default_options = {
        "numbering": True,
        "just_title": False,
        "open": False,
    }

    def get_before_content(self, block_data, block_number):
        return dedent(
            """\
            <details class="note block" %s markdown="1"><summary>%s</summary>\
        """
            % (
                "open" if self.options["open"] else "",
                self.get_summary(block_data, block_number),
            )
        )

    def get_summary(self, block_data, block_number):
        if self.options["just_title"]:
            return block_data["title"]
        elif not self.options["numbering"]:
            return "**Note** - %s" % block_data["title"]
        return "**Note %d** - %s" % (
            block_number,
            block_data["title"],
        )

    def get_after_content(self, block_data, block_number):
        return """</details>"""


class WarningProcessor(CustomBlockProcessor):
    """
    Expands @[warning][title](md content) into a warning, setting classes.
    """

    start_defn = r"@\[warning\]\[(?P<title>.*)\]"
    default_options = {
        "numbering": False,
        "just_title": False,
        "open": True,
    }

    def get_before_content(self, block_data, block_number):
        return dedent(
            """\
            <details class="warning block" %s markdown="1"><summary>%s</summary>\
        """
            % (
                "open" if self.options["open"] else "",
                self.get_summary(block_data, block_number),
            )
        )

    def get_summary(self, block_data, block_number):
        if self.options["just_title"]:
            return block_data["title"]
        elif not self.options["numbering"]:
            return "**Warning** - %s" % block_data["title"]
        return "**Warning %d** - %s" % (
            block_number,
            block_data["title"],
        )

    def get_after_content(self, block_data, block_number):
        return """</details>"""


class ChangeWidthProcessor(CustomBlockProcessor):
    """
    Expands @[page_split][pct] div of proportional width.
    """

    start_defn = r"@\[page_split\]\[(?P<pct>\d+)\]"
    default_options = {}

    def get_before_content(self, block_data, block_number):
        return (
            "<div style='display: inline-block; width: %d"
            % (int(block_data["pct"]) - 0.1)
            + "%;"
            + " %s"
            % (" ".join(f"{key}: {value};" for key, value in self.options.items()))
            + "' markdown='1'>"
        )

    def get_after_content(self, block_data, block_number):
        return dedent(
            """\
            </div>\
        """
        )


class InputOutputProcessor(CustomBlockProcessor):

    start_matcher = re.compile(r"\s*:::(?P<lang>\S*)")
    end_matcher = re.compile(r"^(\S+)|(\s*:::)")
    remove_indent = False

    options = {}
    remove_end_match = False
    content_together = True

    def test(self, parent, block):
        result = super().test(parent, block)
        if not result:
            return result
        for line in block.split("\n"):
            if re.match(r"\s*#\s*has-output", line):
                self.first_match = True
                return True
        return False

    def get_before_content(self, block_data, block_number):
        return dedent(
            """\
            <div class="code_block"><div class="icons"><span class="top"></span></div>

                :::%s
            \
        """
            % block_data.get("lang")
        )

    def get_after_content(self, block_data, block_number):
        return "</details></div>"

    def map_inner_content(self, string, block_data, block_number):
        string = super().map_inner_content(string, block_data, block_number)
        string = re.sub(r"#\s*has-output\s*\n", "", string)
        string = re.sub(
            r"(\s*)#+\s*Output\s*",
            '\n\n<details markdown="1"><summary></summary>\n\n    :::output\n    ',
            string,
        )
        if self.first_match:
            string = string.replace("    " * 2, "    ", 1)
            self.first_match = False
        return string


class MyExtension(markdown.extensions.Extension):
    def __init__(self, *args, **kwargs):
        self.relative_path = kwargs.pop("relative_path", None)
        super().__init__(*args, **kwargs)

    block_processors = [
        (CodeIncluder, 3000),
        (TaskProcessor, 5000),
        (CheckpointProcessor, 5000),
        (NoteProcessor, 5000),
        (WarningProcessor, 5000),
        (ChangeWidthProcessor, 4000),
        (OutputColorer, 2000),
        (InputOutputProcessor, 2500),
    ]

    def extendMarkdown(self, md):
        for processor, priority in self.block_processors:
            p = processor(md.parser)
            p.relative_path = self.relative_path
            md.parser.blockprocessors.register(p, processor.__name__, priority)
        p = NewTabLink(md.parser)
        p.relative_path = self.relative_path
        md.postprocessors.register(p, "NewTabLink", 100)


def md_from_filename(filename):
    with open(filename, "r") as f:
        content = f.read()
        relative_path = os.path.dirname(filename)
        content = markdown.markdown(
            content,
            extensions=[
                "codehilite",
                "sane_lists",
                "extra",
                MyExtension(relative_path=relative_path),
            ],
        )
    filename = filename.replace(".md", ".html")
    if filename.startswith("._"):
        filename = filename[2:]
    with open("md_conv/post_template.html", "r") as template:
        html_content = template.read().replace("<!--CONTENT-->", content)
        with open(filename, "w") as f:
            f.write(html_content)


def should_parse(filename):
    return (
        filename.endswith(".md") and "README" not in filename and "venv" not in filename
    )


parser = argparse.ArgumentParser(description="Process some custom markdown files.")
parser.add_argument(
    "files",
    type=str,
    nargs="*",
    help="Files or Directories to parse. Empty for current directory",
)

args = parser.parse_args()
files_and_dirs = args.files or ["."]

for file_or_dir in files_and_dirs:
    if os.path.isfile(file_or_dir):
        if should_parse(full_filename):
            md_from_filename(file_or_dir)
    else:
        result = os.walk(file_or_dir)
        for root, __, files in result:
            for filename in files:
                full_filename = os.path.join(root, filename)
                if should_parse(full_filename):
                    md_from_filename(full_filename)
