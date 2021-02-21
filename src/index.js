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
    if (process.platform == "linux") {
      await execShellCommand("curl -sL https://github.com/owenthereal/upterm/releases/download/0.5.2/linux-amd64-v0.5.2.tar.gz | tar zxvf - --strip-components=1 -C /tmp && sudo install /tmp/upterm /usr/local/bin/")
      await execShellCommand("sudo apt-get -y install tmux")
    } else {
      await execShellCommand("brew install owenthereal/upterm/upterm")
      await execShellCommand("brew install tmux")
    }
    core.debug("Installed dependencies successfully")

    core.debug("Generating SSH keys")
    fs.mkdirSync(path.join(os.homedir(), ".ssh"), { recursive: true })
    try {
      await execShellCommand(`ssh-keygen -q -t rsa -N "" -f ~/.ssh/id_rsa; ssh-keygen -q -t ed25519 -N "" -f ~/.ssh/id_ed25519`);
    } catch { }    
    core.debug("Generated SSH keys successfully")
    core.debug("Configuring ssh client")
    fs.appendFileSync(path.join(os.homedir(), ".ssh/config"), "Host *\nStrictHostKeyChecking no\nCheckHostIP no\n" +
      "TCPKeepAlive yes\nServerAliveInterval 30\nServerAliveCountMax 180\nVerifyHostKeyDNS yes\nUpdateHostKeys yes\n")
    // entry in known hosts file in mandatory in upterm. attempt ssh connection to upterm server
    // to get the host key added to ~/.ssh/known_hosts
    try {
      await execShellCommand("ssh -i ~/.ssh/id_ed25519 uptermd.upterm.dev")
    } catch { }
    // @cert-authority entry is the mandatory entry. generate the entry based on the known_hosts entry key
    try {
      await execShellCommand('cat <(cat ~/.ssh/known_hosts | awk \'{ print "@cert-authority * " $2 " " $3 }\') >> ~/.ssh/known_hosts')
    } catch { }
    core.debug("Creating new session")
    await execShellCommand("tmux new -d -s upterm-wrapper -x 132 -y 43 \"upterm host --force-command 'tmux attach -t upterm' -- tmux new -s upterm -x 132 -y 43\"")
    await new Promise(r => setTimeout(r, 2000))
    await execShellCommand("tmux send-keys -t upterm-wrapper q C-m")
    console.debug("Created new session successfully")

    core.debug("Fetching connection strings")
    await new Promise(r => setTimeout(r, 1000))

    console.debug("Entering main loop")
    while (true) {
      try {
        core.info(await execShellCommand('bash -c "upterm session current --admin-socket ~/.upterm/*.sock"'));
      } catch (error) {
        core.info(error.message);
        break
      }

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
