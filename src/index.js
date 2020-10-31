import os from "os"
import fs from "fs"
import path from "path"
import * as core from "@actions/core"

import { execShellCommand } from "./helpers"

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function run() {
  try {
    if (process.platform === "win32") {
      core.info("Windows is not supported by upterm, skipping...")
      return
    }

    core.debug("Installing dependencies")
    await execShellCommand("brew install owenthereal/upterm/upterm")
    await execShellCommand("brew install tmux")
    core.debug("Installed dependencies successfully")

    core.debug("Generating SSH keys")
    fs.mkdirSync(path.join(os.homedir(), ".ssh"), { recursive: true })
    try {
      await execShellCommand(`echo -e 'y\n'|ssh-keygen -q -t rsa -N "" -f ~/.ssh/id_rsa`);
    } catch { }
    core.debug("Generated SSH-Key successfully")
    core.debug("Configuring ssh client")
    fs.appendFileSync(path.join(os.homedir(), ".ssh/config"), "Host *\nStrictHostKeyChecking no\nCheckHostIP no\n")
    // entry in known hosts file in mandatory in upterm. attempt ssh connection to upterm server
    // to get the host key added to ~/.ssh/known_hosts
    try {
      await execShellCommand("ssh uptermd.upterm.dev")
    } catch { }
    core.debug("Creating new session")
    await execShellCommand("tmux new -d -s upterm-wrapper \"upterm host --force-command 'tmux attach -t upterm' -- tmux new -s upterm\"")
    await new Promise(r => setTimeout(r, 2000))
    await execShellCommand("tmux send-keys -t upterm-wrapper q C-m")
    console.debug("Created new session successfully")

    core.debug("Fetching connection strings")
    const uptermSessionInfo = await execShellCommand('bash -c "upterm session current --admin-socket ~/.upterm/*.sock"');

    console.debug("Entering main loop")
    while (true) {
      core.info(`${uptermSessionInfo}`);

      const skip = fs.existsSync("/continue") || fs.existsSync(path.join(process.env.GITHUB_WORKSPACE, "continue"))
      if (skip) {
        core.info("Exiting debugging session because '/continue' file was created")
        break
      }
      await sleep(5000)
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}
