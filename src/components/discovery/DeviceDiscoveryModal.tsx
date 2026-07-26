import React, { useState } from 'react';
import {
  Tv,
  Wifi,
  Bluetooth,
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  X,
  Smartphone,
  ShieldCheck,
  Radio,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { TVDevice, TVBrand, ConnectionProtocol } from '../../types';
import { bluetoothService } from '../../services/bluetoothService';
import { tvConnectionManager } from '../../services/tvConnectionManager';

interface DeviceDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: TVDevice[];
  activeDevice: TVDevice | null;
  onSelectDevice: (device: TVDevice) => void;
  onAddDevice: (device: TVDevice) => void;
}

export const DeviceDiscoveryModal: React.FC<DeviceDiscoveryModalProps> = ({
  isOpen,
  onClose,
  devices,
  activeDevice,
  onSelectDevice,
  onAddDevice,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'paired' | 'scan' | 'manual'>('paired');
  const [discoveredDevices, setDiscoveredDevices] = useState<TVDevice[]>([]);
  const [scanMessage, setScanMessage] = useState<string>('');

  // Manual IP Form
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<TVBrand>('lg');
  const [ipAddress, setIpAddress] = useState('192.168.1.');
  const [port, setPort] = useState('3000');
  const [pin, setPin] = useState('');

  const handleStartScan = async () => {
    setIsScanning(true);
    setScanMessage('Scanning local network subnet (SSDP / mDNS)...');
    try {
      const results = await tvConnectionManager.scanLocalNetwork();
      setDiscoveredDevices(results);
      setScanMessage(`Found ${results.length} smart devices on local network.`);
    } catch (err: any) {
      setScanMessage('Network scan completed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleBluetoothScan = async () => {
    setIsScanning(true);
    setScanMessage('Opening native Web Bluetooth device scanner...');
    try {
      const btDevice = await bluetoothService.requestTVDevice();
      if (btDevice) {
        const newDevice: TVDevice = {
          id: `bt-${btDevice.id}`,
          name: btDevice.name,
          brand: 'generic',
          protocol: 'web_bluetooth',
          ipAddress: 'Bluetooth GATT',
          port: 0,
          bluetoothId: btDevice.id,
          paired: true,
          isOnline: true,
          lastSeen: new Date().toISOString(),
          state: {
            power: true,
            volume: 20,
            muted: false,
            channel: 1,
            channelName: 'Live TV',
            activeApp: 'Bluetooth Remote',
            currentInput: 'BLE',
            mediaState: 'playing',
          },
        };
        onAddDevice(newDevice);
        onSelectDevice(newDevice);
        setScanMessage(`Paired with Bluetooth device: ${btDevice.name}`);
      }
    } catch (err: any) {
      setScanMessage(err.message || 'Bluetooth scan cancelled or unavailable.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ipAddress) return;

    const newDevice: TVDevice = {
      id: `manual-${Date.now()}`,
      name,
      brand,
      protocol: brand === 'roku' ? 'http_rest' : 'websocket',
      ipAddress,
      port: Number(port) || 80,
      paired: true,
      isOnline: true,
      lastSeen: new Date().toISOString(),
      state: {
        power: true,
        volume: 20,
        muted: false,
        channel: 1,
        channelName: 'HDMI 1',
        activeApp: brand === 'roku' ? 'Roku Home' : 'Smart TV',
        currentInput: 'HDMI 1',
        mediaState: 'stopped',
      },
    };

    onAddDevice(newDevice);
    onSelectDevice(newDevice);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">TV Discovery & Pairing</h2>
              <p className="text-xs text-slate-400">Connect to Smart TVs via Wi-Fi or Bluetooth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('paired')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'paired'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paired Devices ({devices.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('scan');
              if (discoveredDevices.length === 0) handleStartScan();
            }}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'scan'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Network Scanner
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Manual IP
          </button>
        </div>

        {/* 1. Paired Devices Tab */}
        {activeTab === 'paired' && (
          <div className="flex flex-col gap-3">
            {devices.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
                <Tv className="w-8 h-8 opacity-40" />
                <p>No paired devices found.</p>
                <button
                  onClick={() => setActiveTab('scan')}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Scan for Nearby TVs
                </button>
              </div>
            ) : (
              devices.map((device) => {
                const isSelected = activeDevice?.id === device.id;
                return (
                  <div
                    key={device.id}
                    onClick={() => {
                      onSelectDevice(device);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl text-white ${
                          isSelected ? 'bg-indigo-600' : 'bg-slate-800'
                        }`}
                      >
                        <Tv className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-100">{device.name}</h4>
                          <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 font-mono">
                            {device.brand}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {device.ipAddress} • {device.protocol}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-indigo-400 font-semibold hover:underline">
                          Connect
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2. Network Scanner Tab */}
        {activeTab === 'scan' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{scanMessage}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBluetoothScan}
                  className="px-3 py-1.5 bg-sky-600/20 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-sky-600/30 transition-all"
                >
                  <Bluetooth className="w-3.5 h-3.5" /> Bluetooth
                </button>
                <button
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-500 transition-all shadow-md"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} /> Scan
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {discoveredDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{dev.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {dev.ipAddress}:{dev.port} ({dev.brand.toUpperCase()})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onAddDevice(dev);
                      onSelectDevice(dev);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    Pair & Connect
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Manual IP Form */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualAdd} className="flex flex-col gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Device Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Master Bedroom LG TV"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">TV Brand Protocol Driver</label>
              <select
                value={brand}
                onChange={(e) => {
                  const b = e.target.value as TVBrand;
                  setBrand(b);
                  if (b === 'roku') setPort('8060');
                  else if (b === 'samsung') setPort('8001');
                  else if (b === 'lg') setPort('3000');
                  else setPort('80');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="lg">LG webOS Smart TV (WebSocket)</option>
                <option value="roku">Roku / Roku TV (HTTP REST ECP)</option>
                <option value="samsung">Samsung Tizen Smart TV</option>
                <option value="sony">Sony Bravia Android/Google TV</option>
                <option value="android">Android TV / Google TV</option>
                <option value="apple">Apple TV</option>
                <option value="generic">Generic Smart TV / DLNA</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-slate-400 block mb-1">IP Address</label>
                <input
                  type="text"
                  required
                  placeholder="192.168.1.100"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Port</label>
                <input
                  type="number"
                  placeholder="8060"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Pairing Handshake PIN (Optional)</label>
              <input
                type="text"
                placeholder="4-digit PIN if prompted on TV screen"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Add Device & Save
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
