import { useSyncProviders } from "./hooks/useSyncProviders";
import "./App.css";
import { useState } from "react";

const App = () => {
  const [selectedWallet, setSelectedWallet] = useState<EIP6963ProviderDetail>();
  const [userAccount, setUserAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [inputAddress, setInputAddress] = useState<string>(""); // Add state for input field
  const [inputBalance, setInputBalance] = useState<string>(""); // Add state for balance of the input address
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
        params: [account, "latest"], // Getting balance at the latest block
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

  // Fetch balance based on input address using the selected provider or a default provider (like Infura)
  const fetchInputAddressBalance = async () => {
    try {
      if (!inputAddress) {
        setError("Please enter a valid address.");
        return;
      }

      // Assuming you are using the selected wallet's provider or a default one
      const provider = selectedWallet?.provider; // Use the selected wallet provider
      if (!provider) {
        setError("No wallet provider connected.");
        return;
      }

      const balance = await provider.request({
        method: "eth_getBalance",
        params: [inputAddress, "latest"],
      });

      const balanceInEther = (
        parseInt(balance as string, 16) /
        10 ** 18
      ).toFixed(4);
      setInputBalance(balanceInEther);
    } catch (error) {
      console.error("Error fetching balance for input address:", error);
      setError("Failed to fetch balance for the provided address.");
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
      <hr />

      {/* Input field for manually checking balance */}
      <div className="inputAddressBalance">
        <h2>Check Balance for Any Address</h2>
        <input
          type="text"
          placeholder="Enter Ethereum address"
          value={inputAddress}
          onChange={(e) => setInputAddress(e.target.value)}
        />
        <button onClick={fetchInputAddressBalance}>Check Balance</button>

        {/* Display input address balance */}
        {inputBalance && (
          <div>
            <strong>Balance:</strong> {inputBalance} ETH
          </div>
        )}
      </div>

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
