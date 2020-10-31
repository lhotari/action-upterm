# Debug your [GitHub Actions](https://github.com/features/actions) by using upterm

This GitHub Action offers you a direct way to interact with the host system on which the actual scripts (Actions) will run. This action started as a fork of [mxschmitt/action-tmate](https://github.com/mxschmitt/action-tmate).

## Features

- Debug your GitHub Actions by using SSH
- Continue your Workflows afterwards

## Supported Operating Systems

- `Linux`
- `macOS`
- (`Window` is **not** supported. It will be skipped so that the Pipeline does not fail)

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

## Continue a workflow

If you want to continue a workflow and you are inside a upterm session, just create a empty file with the name `continue` either in the root directory or in the project directory by running `touch continue` or `sudo touch /continue`.
