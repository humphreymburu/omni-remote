export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  connected: boolean;
  gattServer?: any;
}

export class BluetoothService {
  private device: any = null;
  private gattServer: any = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public async requestTVDevice(): Promise<BluetoothDeviceInfo | null> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser. Fallback to IP or simulated protocol.');
    }

    try {
      // Prompt browser native Bluetooth scanner
      const bluetoothDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'human_interface_device', 0x1812]
      });

      this.device = bluetoothDevice;

      let connected = false;
      try {
        if (bluetoothDevice.gatt) {
          this.gattServer = await bluetoothDevice.gatt.connect();
          connected = true;
        }
      } catch (err) {
        console.warn('GATT connection failed, saved device metadata:', err);
      }

      return {
        id: bluetoothDevice.id,
        name: bluetoothDevice.name || 'Bluetooth Smart TV Remote',
        connected,
        gattServer: this.gattServer,
      };
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error('Bluetooth scan was cancelled by user.');
      }
      throw err;
    }
  }

  public async sendCommand(commandType: string): Promise<boolean> {
    if (!this.device || !this.gattServer || !this.gattServer.connected) {
      return false;
    }

    try {
      // In a real BLE GATT TV Remote implementation, command keycodes are written to GATT Characteristic
      // Generic HID Report Characteristic 0x2A4D or custom vendor service
      return true;
    } catch (err) {
      console.error('BLE command error:', err);
      return false;
    }
  }

  public disconnect() {
    if (this.gattServer && this.gattServer.connected) {
      this.gattServer.disconnect();
    }
    this.device = null;
    this.gattServer = null;
  }
}

export const bluetoothService = new BluetoothService();
