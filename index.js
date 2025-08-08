import { Qrwc } from '@q-sys/qrwc';
import WebSocket from "ws";
import 'dotenv/config';

const setupConnection = async () => {
  // const coreIP = process.env.CORE_IP_ADDRESS ?? ''
  const coreIP = process.platform === "win32" ? "10.126.8.139" : "127.0.0.1";

  const socket = new WebSocket(`ws://${coreIP}/qrc-public-api/v0`);

  // No generics in JS; just call the function
  const qrwc = await Qrwc.createQrwc({
    socket,
    pollingInterval: 100
  });

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

setupConnection();
