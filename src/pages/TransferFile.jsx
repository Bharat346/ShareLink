import React from "react";
import { BluetoothProvider, useBluetoothDevice } from "react-web-bluetooth";

function BluetoothComponent() {
  const { requestDevice, device, server, error } = useBluetoothDevice({
    acceptAllDevices: true, // or filter with services
    optionalServices: ["battery_service"], // example
  });

  return (
    <div>
      <h2>Bluetooth File Transfer</h2>

      <button onClick={requestDevice}>Connect Bluetooth Device</button>

      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

      {device && <p>Connected to: {device.name}</p>}
      {server && <p>GATT Server connected ✅</p>}
    </div>
  );
}

export default function TransferFile() {
  return (
    <BluetoothProvider>
      <BluetoothComponent />
    </BluetoothProvider>
  );
}
