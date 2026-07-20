import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { arcTestnet, mainnet } from "viem/chains";

export const wagmiConfig = createConfig({
  chains: [arcTestnet, mainnet],

  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],

  transports: {
    [arcTestnet.id]: http(
      "https://rpc.testnet.arc.network"
    ),

    [mainnet.id]: http(
      "https://cloudflare-eth.com"
    ),
  },

  multiInjectedProviderDiscovery: true,
  ssr: true,
});