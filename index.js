import { Qrwc } from '@q-sys/qrwc';
import WebSocket from "ws";
import 'dotenv/config';

const setupConnection = async () => {
  const coreIP = process.platform === "win32" ? "10.126.8.139" : "127.0.0.1";
  const socket = new WebSocket(`ws://${coreIP}/qrc-public-api/v0`);

  // Wait for the WebSocket connection to be open
  await new Promise((resolve, reject) => {
    socket.on('open', resolve);
    socket.on('error', reject);
  });

  const qrwc = await Qrwc.createQrwc({
    socket,
    pollingInterval: 100
  });

  // Optionally: Wait for components to load, or check if they exist
  // This may depend on the QRWC API and your config.
  // If the API provides a 'ready' event, listen for it.
  // Otherwise, you may need to poll or re-fetch components.

  if (!qrwc.components.Gain || !qrwc.components.Gain_1 || !qrwc.components.Gain_2) {
    console.error("One or more Gain components are missing from qrwc.components");
    return;
  }

  const gain0 = qrwc.components.Gain.controls.gain;
  const gain1 = qrwc.components.Gain_1.controls.gain;
  const gain2 = qrwc.components.Gain_2.controls.gain;

  const avg = async (_state) => {
    await gain0.update(
      ((gain1.state.Value ?? 0) + (gain2.state.Value ?? 0)) / 2
    );
  };

  gain1.on('update', avg);
  gain2.on('update', avg);

  qrwc.on('disconnected', () => {
    setTimeout(() => {
      setupConnection();
    }, 1000);
  });
};

setupConnection().catch(err => {
  console.error("Setup failed:", err);
});
