# Debug your [GitHub Actions](https://github.com/features/actions) by using ssh

This GitHub Action offers you a direct way to interact with the host system on which the actual scripts (Actions) will run.
This action started as a fork of [mxschmitt/action-tmate](https://github.com/mxschmitt/action-tmate).
Instead of tmate, this action uses [upterm](https://upterm.dev/) and [tmux](https://github.com/tmux/tmux/wiki).

## Features

- Debug your GitHub Actions by using SSH
- Continue your Workflows afterwards

## Supported Operating Systems

- `Linux`
- `macOS`
- (`Windows` is **not** supported. It will be skipped so that the Pipeline does not fail)

## Getting Started

By using this minimal example a [upterm](https://upterm.dev/) session will be created.

```yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup upterm session
      uses: lhotari/action-upterm@v1
```

To get the ssh connection string, just open the `Checks` tab in your Pull Request and scroll to the bottom.

## Use registered public SSH key(s)

By default anybody can connect to the upterm session. You can opt-in to install the public SSH keys [that you have registered with your GitHub profile](https://docs.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account).

```yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup upterm session
      uses: lhotari/action-upterm@v1
      with:
        ## limits ssh access and adds the ssh public key for the user which triggered the workflow
        limit-access-to-actor: true
        ## limits ssh access and adds the ssh public keys of the listed GitHub users
        limit-access-to-users: githubuser1,githubuser2
```

If the registered public SSH key is not your default private SSH key, you will need to specify the path manually, like so: `ssh -i <path-to-key> <upterm-connection-string>`.


## Use custom upterm server

Follow instructions to [deploy Upterm server to Heroku](https://github.com/owenthereal/upterm#heroku). There are also [other deployment options available](https://github.com/owenthereal/upterm#deploy-uptermd).

You can configure the Upterm server with the `upterm-server` input parameter, for example:

```yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup upterm session
      uses: lhotari/action-upterm@v1
      with:
        ## limits ssh access and adds the ssh public key for the user which triggered the workflow
        limit-access-to-actor: true
        ## Use the Heroku deployed Uptermd server via Websocket
        upterm-server: wss://YOUR_HEROKU_APP_URL
```

## Continue a workflow

If you want to continue a workflow and you are inside a upterm session, just create a empty file with the name `continue` either in the root directory or in the workspace directory by running `touch continue` or `sudo touch /continue`.
Closing the terminal will also continue the workflow. However you won't be able to reconnect in that case. 
It's possible to detach from the terminal and not continue by first pressing `C-b` and then `d` (tmux detach command keys).

## Usage tips

### Resizing tmux window (requires ubuntu-latest)

After connecting with ssh:
* Hit `control-b`, then type `:resize-window -A` + `<enter>`

This will resize the console to the full width and height of the connected terminal.
([More information](https://unix.stackexchange.com/a/570015))

