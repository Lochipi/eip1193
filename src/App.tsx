import { useSyncProviders } from "./hooks/useSyncProviders";
import "./App.css";
import { useState } from "react";

const App = () => {
  const [selectedWallet, setSelectedWallet] = useState<EIP6963ProviderDetail>();
  const [userAccount, setUserAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const providers = useSyncProviders();

  const [errorMessage, setErrorMessage] = useState("");
  const clearError = () => setErrorMessage("");
  const setError = (error: string) => setErrorMessage(error);
  const isError = !!errorMessage;

  const formatAddress = (addr: string) => {
    const upperAfterLastTwo = addr.slice(0, 2) + addr.slice(2);
    return `${upperAfterLastTwo.substring(
      0,
      5
    )}...${upperAfterLastTwo.substring(39)}`;
  };

  const fetchBalance = async (provider: EIP1193Provider, account: string) => {
    try {
      const balance = await provider.request({
        method: "eth_getBalance",
        params: [account, "latest"], // Geting balance at the latest block
      });
      // Converting balance from wei to ether and set it
      const balanceInEther = (
        parseInt(balance as string, 16) /
        10 ** 18
      ).toFixed(4);
      setBalance(balanceInEther);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setError("Failed to fetch balance");
    }
  };

  const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
    try {
      const accounts = (await providerWithInfo.provider.request({
        method: "eth_requestAccounts",
      })) as string[];

      setSelectedWallet(providerWithInfo);
      const userAccount = accounts?.[0];
      setUserAccount(userAccount);

      // Fetch balance once the account is connected
      await fetchBalance(providerWithInfo.provider, userAccount);
    } catch (error) {
      console.error(error);
      const mmError: MMError = error as MMError;
      setError(`Code: ${mmError.code} \nError Message: ${mmError.message}`);
    }
  };

  return (
    <div className="App">
      <h2>Wallets Detected:</h2>
      <div className="providers">
        {providers.length > 0 ? (
          providers?.map((provider: EIP6963ProviderDetail) => (
            <button
              key={provider.info.uuid}
              onClick={() => handleConnect(provider)}
            >
              <img src={provider.info.icon} alt={provider.info.name} />
              <div>{provider.info.name}</div>
            </button>
          ))
        ) : (
          <div>No Announced Wallet Providers</div>
        )}
      </div>
      <hr />
      <h2>{userAccount ? "" : "No"} Wallet Selected</h2>
      {userAccount && (
        <div className="selectedWallet">
          <img
            src={selectedWallet?.info.icon}
            alt={selectedWallet?.info.name}
          />
          <div>{selectedWallet?.info.name}</div>
          <div>({formatAddress(userAccount)})</div>
          <div>Balance: {balance} ETH</div> {/* Display balance */}
        </div>
      )}
      <div
        className="mmError"
        style={isError ? { backgroundColor: "brown" } : {}}
      >
        {isError && (
          <div onClick={clearError}>
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;