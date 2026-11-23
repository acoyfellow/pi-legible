# pi-legible-bash

Agents write shell commands as one long line. You have to read them.

This [pi](https://pi.dev) extension does two small things:

1. **Shows** every `bash` call one step per line. The command that runs is unchanged.
2. **Asks** the model to write legible commands in the first place.

Before:

```
$ sleep 2; tmux send-keys -t login -l "/quit"; tmux send-keys -t login Enter; sleep 3; cd ~/app && Q="How many zones?"; node evals/talker.mjs app/talker "$Q" | tail -3
```

After:

```
$ sleep 2
  tmux send-keys -t login -l "/quit"
  tmux send-keys -t login Enter
  sleep 3
  cd ~/app &&
    Q="How many zones?"
  node evals/talker.mjs app/talker "$Q" |
    tail -3
```

## Install

```sh
pi install git:github.com/acoyfellow/pi-legible-bash
```

Then `/reload` or start a new session.

## What it does

**Display.** It splits at top-level `;`, `&&`, `||`, `|` and newlines, and indents continuations. It never splits inside quotes, `$( )`, `( )`, `{ }` or heredoc bodies, so `jq` filters and inline scripts stay whole. Long single commands wrap before flags. Only the transcript changes.

**Prompt.** It appends a short rule to the system prompt: one step per line, a script file for more than three steps or any loop, no long inline Python or jq, name long paths once.

## What it does not do

- It does not change what runs.
- It does not format code in chat replies, or tools other than `bash` and `powershell`.
- It is not a full shell parser. Unusual syntax is shown as written.

## Related

[pi-code-previews](https://github.com/mattleong/pi-code-previews) adds syntax highlighting to all built-in tools. It keeps commands on one line. Both register renderers; the one loaded later takes the `bash` call display.

## Develop

```sh
bun test
```

MIT
