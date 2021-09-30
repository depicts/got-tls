const { Server } = require("../src");
const { sleep } = require("../src/util/main");

test("Should Start And Connect To Proxy Client", async () => {
  let didConnect = await (async () => {
    let maxWaitTime = 10000;
    let timeWaited = 0;

    Server.connect();

    while (!Server.isConnected) {
      (await sleep(100)) && (timeWaited += 100);
      if (timeWaited > maxWaitTime) {
        return false;
      }
    }

    return true;
  })();

  expect(didConnect).toEqual(true);
});
