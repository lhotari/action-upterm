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
    core.debug("Installed dependencies successfully")

    core.debug("Generating SSH keys")
    fs.mkdirSync(path.join(os.homedir(), ".ssh"), { recursive: true })
    try {
      await execShellCommand(`echo -e 'y\n'|ssh-keygen -q -t rsa -N "" -f ~/.ssh/id_rsa`);
    } catch { }
    core.debug("Generated SSH-Key successfully")
    core.debug("Configuring ssh client")
    fs.appendFileSync(path.join(os.homedir(), ".ssh/config"), "Host *\nStrictHostKeyChecking no\nCheckHostIP no\n")

    core.debug("Creating new session")
    await execShellCommand("upterm host -- bash")
    console.debug("Created new session successfully")

    core.debug("Fetching connection strings")
    const uptermSessionInfo = await execShellCommand('upterm session current');

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
