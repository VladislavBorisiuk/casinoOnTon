import { TonConnectUIProvider } from '@tonconnect/ui-react';
import App from './App';

const manifestUrl = 'https://telegram-casinoapp.vercel.app/tonconnect-manifest.json';

console.log('[AppWrapper] Loaded AppWrapper with manifest:', manifestUrl);

export default function AppWrapper() {
  console.log('[AppWrapper] Rendering AppWrapper...');
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  );
}
