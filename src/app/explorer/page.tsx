import type { Metadata } from 'next';
import { ExplorerClient } from './client';

export const metadata: Metadata = {
  title: 'Forensic Explorer',
  description:
    'On-chain intelligence for Polkadot and its parachains. Investigate addresses, trace fund flows, and analyze transaction patterns.',
  openGraph: {
    title: 'HubSec Forensic Explorer',
    description: 'On-chain intelligence for Polkadot and its parachains.',
    url: 'https://hubsec.net/explorer',
  },
};

export default function ExplorerPage() {
  return <ExplorerClient />;
}
