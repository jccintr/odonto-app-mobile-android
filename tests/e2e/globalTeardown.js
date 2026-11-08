module.exports = async () => {
  const child = globalThis.__DEMO_API__;
  if (!child) return;
  child.removeAllListeners('exit');
  child.kill('SIGTERM');
  await new Promise((resolve) => { child.on('exit', resolve); setTimeout(resolve, 8000); });
};
