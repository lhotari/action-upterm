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
    core.getInput.mockReturnValue("true")
    const customConnectionString = "foobar"
    execShellCommand.mockReturnValue(Promise.resolve(customConnectionString))
    await run()
    expect(execShellCommand).toHaveBeenNthCalledWith(1, "curl -L https://github.com/owenthereal/upterm/releases/download/0.5.2/linux-amd64-v0.5.2.tar.gz | tar zxvf - --strip-components=1 --wildcards '*/upterm' && sudo mv upterm /usr/local/bin/")
    expect(execShellCommand).toHaveBeenNthCalledWith(2, "sudo apt-get -y install tmux")
    expect(core.info).toHaveBeenNthCalledWith(1, `${customConnectionString}`);
    expect(core.info).toHaveBeenNthCalledWith(2, "Exiting debugging session because '/continue' file was created");
  });
  it('should install using brew on macos', async () => {
    Object.defineProperty(process, "platform", {
      value: "darwin"
    })
    core.getInput.mockReturnValue("true")
    const customConnectionString = "foobar"
    execShellCommand.mockReturnValue(Promise.resolve(customConnectionString))
    await run()
    expect(execShellCommand).toHaveBeenNthCalledWith(1, "brew install owenthereal/upterm/upterm")
    expect(execShellCommand).toHaveBeenNthCalledWith(2, "brew install tmux")
    expect(core.info).toHaveBeenNthCalledWith(1, `${customConnectionString}`);
    expect(core.info).toHaveBeenNthCalledWith(2, "Exiting debugging session because '/continue' file was created");
  });

});
