import { when } from 'jest-when'
jest.mock('@actions/core');
import * as core from "@actions/core"

jest.mock("fs", () => ({
  mkdirSync: () => true,
  existsSync: () => true,
  appendFileSync: () => true
}));
jest.mock('./helpers');
import { execShellCommand } from "./helpers"
import { run } from "."

describe('upterm GitHub integration', () => {
  const originalPlatform = process.platform;

  afterAll(() => {
    Object.defineProperty(process, "platform", {
      value: originalPlatform
    })
  });

  it('should skip for windows', async () => {
    Object.defineProperty(process, "platform", {
      value: "win32"
    })
    await run()
    expect(core.info).toHaveBeenCalledWith('Windows is not supported by upterm, skipping...');
  });
  it('should handle the main loop', async () => {
    Object.defineProperty(process, "platform", {
      value: "linux"
    })
    when(core.getInput).calledWith("limit-access-to-users").mockReturnValue("")
    when(core.getInput).calledWith("limit-access-to-actor").mockReturnValue("false")
    when(core.getInput).calledWith("upterm-server").mockReturnValue("ssh://myserver:22")
    const customConnectionString = "foobar"
    execShellCommand.mockReturnValue(Promise.resolve(customConnectionString))
    await run()
    expect(execShellCommand).toHaveBeenNthCalledWith(1, "curl -sL https://github.com/owenthereal/upterm/releases/download/v0.6.7/upterm_linux_amd64.tar.gz | tar zxvf - -C /tmp upterm && sudo install /tmp/upterm /usr/local/bin/")
    expect(execShellCommand).toHaveBeenNthCalledWith(2, "sudo apt-get -y install tmux")
    expect(core.info).toHaveBeenNthCalledWith(1, "Creating a new session. Connecting to upterm server ssh://myserver:22")
    expect(core.info).toHaveBeenNthCalledWith(2, `${customConnectionString}`);
    expect(core.info).toHaveBeenNthCalledWith(3, "Exiting debugging session because '/continue' file was created");
  });
  it('should install using brew on macos', async () => {
    Object.defineProperty(process, "platform", {
      value: "darwin"
    })
    when(core.getInput).calledWith("limit-access-to-users").mockReturnValue("")
    when(core.getInput).calledWith("limit-access-to-actor").mockReturnValue("false")
    when(core.getInput).calledWith("upterm-server").mockReturnValue("ssh://myserver:22")
    const customConnectionString = "foobar"
    execShellCommand.mockReturnValue(Promise.resolve(customConnectionString))
    await run()
    expect(execShellCommand).toHaveBeenNthCalledWith(1, "brew install owenthereal/upterm/upterm")
    expect(execShellCommand).toHaveBeenNthCalledWith(2, "brew install tmux")
    expect(core.info).toHaveBeenNthCalledWith(1, "Creating a new session. Connecting to upterm server ssh://myserver:22")
    expect(core.info).toHaveBeenNthCalledWith(2, `${customConnectionString}`);
    expect(core.info).toHaveBeenNthCalledWith(3, "Exiting debugging session because '/continue' file was created");
  });

});
