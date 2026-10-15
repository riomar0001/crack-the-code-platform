const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function browser() {
  const elements = {
    'container-connection-info': {
      textContent: '', style: {}, replaceChildren() { this.textContent = ''; },
    },
  };
  const timers = new Map();
  const requests = [];
  let timerId = 0;
  const context = {
    CTFd: { _internal: { challenge: {} }, lib: { $: () => ({ val: () => '3' }) } },
    init: { csrfNonce: 'test' },
    document: { getElementById: id => elements[id] },
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id),
    XMLHttpRequest: function () {
      this.open = this.setRequestHeader = () => {};
      this.send = () => requests.push(this);
    },
    console,
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,
    '../../CTFd/plugins/containers/assets/view.js'), 'utf8'), context);
  return { context, timers, requests, info: elements['container-connection-info'] };
}

test('booting hides connection details and automatically reveals them when ready', () => {
  const b = browser();
  b.context.display_connection({ protocol: 'rdp', ready: false, notice: 'Windows is booting.' }, 3);
  assert.equal(b.info.textContent, 'Windows is booting.');
  assert.equal(b.timers.size, 1);
  [...b.timers.values()][0]();
  const xhr = b.requests[0];
  xhr.status = 200;
  xhr.responseText = JSON.stringify({ status: 'already_running', protocol: 'rdp', ready: true,
    hostname: '192.0.2.1', port: 12345, username: 'player', password: 'test-secret', notice: 'Ready' });
  xhr.onload();
  assert.match(b.info.textContent, /192\.0\.2\.1:12345/);
  assert.match(b.info.textContent, /Username: player/);
  assert.match(b.info.textContent, /Password: test-secret/);
  assert.equal(b.timers.size, 0);
});

test('stale readiness response cannot reveal credentials after cancellation', () => {
  const b = browser();
  b.context.poll_readiness(3);
  b.context.stop_readiness_poll();
  b.info.textContent = 'Resetting Windows instance...';
  const xhr = b.requests[0];
  xhr.status = 200;
  xhr.responseText = JSON.stringify({ status: 'already_running', protocol: 'rdp', ready: true,
    hostname: '192.0.2.1', port: 12345, username: 'old-player', password: 'old-secret' });
  xhr.onload();
  assert.equal(b.info.textContent, 'Resetting Windows instance...');
  assert.equal(b.timers.size, 0);
});
