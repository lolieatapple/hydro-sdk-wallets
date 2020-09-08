import { BigNumber } from "ethers/utils";
import { getAccount, getWallet } from "../selector/wallet";
import {
  BaseWallet,
  HydroWallet,
  ExtensionWallet,
  NeedUnlockWalletError,
  NotSupportedError,
  WalletConnectWallet,
  Ledger,
  Dcent,
  CoinbaseWallet,
  getNetworkID,
  Fortmatic,
  Trezor
  // Torus
} from "../wallets";
import { AccountState } from "../reducers/wallet";
export const WALLET_STEPS = {
  SELECT: "SELECT",
  CREATE: "CREATE",
  CREATE_CONFIRM: "CREATE_CONFIRM",
  BACKUP: "BACKUP",
  TEST_MNEMONIC: "TEST_MNEMONIC",
  ADD_FUNDS: "ADD_FUNDS",
  IMPORT: "IMPORT",
  DELETE: "DELETE"
};

const TIMER_KEYS = {
  ADDRESS: "ADDRESS",
  STATUS: "STATUS",
  BALANCE: "BALANCE",
  NETWORK: "NETWORK"
};

const timers: { [key: string]: { [key: string]: number } } = {};

const setTimer = (accountID: string, timerKey: string, nextTimer: number) => {
  if (!timers[accountID]) {
    timers[accountID] = {};
  }

  timers[accountID][timerKey] = nextTimer;
};

const clearTimer = (accountID: string) => {
  if (timers[accountID]) {
    Object.values(timers[accountID]).forEach(window.clearTimeout);
    timers[accountID] = {};
  }
};

const isTimerExist = (accountID: string) => {
  return !!timers[accountID];
};

export const destoryTimer = () => {
  Object.keys(timers).map(accountID => {
    clearTimer(accountID);
  });
};

export const cacheWallet = (wallet: HydroWallet, password: string) => {
  return {
    type: "HYDRO_WALLET_CACHE_WALLET",
    payload: { wallet, password }
  };
};

export const setUnit = (unit: string, decimals: number) => {
  return {
    type: "HYDRO_WALLET_SET_UNIT",
    payload: { unit, decimals }
  };
};

export const initCustomLocalWallet = (walletClass: any) => {
  return {
    type: "HYDRO_WALLET_INIT_CUSTOM_LOCAL_WALLET",
    payload: { walletClass }
  };
};

export const selectWalletType = (type: string) => {
  return {
    type: "HYDRO_WALLET_SELECT_WALLET_TYPE",
    payload: { type }
  };
};

export const setTranslations = (translations: { [key: string]: string }) => {
  return {
    type: "HYDRO_WALLET_SET_TRANSLATIONS",
    payload: { translations }
  };
};

export const setWalletStep = (step: string) => {
  return {
    type: "HYDRO_WALLET_SET_STEP",
    payload: { step }
  };
};

export const initAccount = (accountID: string, wallet: BaseWallet) => {
  return {
    type: "HYDRO_WALLET_INIT_ACCOUNT",
    payload: {
      accountID,
      wallet
    }
  };
};

export const updateWallet = (wallet: BaseWallet) => {
  return {
    type: "HYDRO_WALLET_UPDATE_WALLET",
    payload: {
      wallet
    }
  };
};

export const loadAddress = (accountID: string, address: string | null) => {
  return {
    type: "HYDRO_WALLET_LOAD_ADDRESS",
    payload: { accountID, address }
  };
};

export const loadBalance = (accountID: string, balance: BigNumber) => {
  return {
    type: "HYDRO_WALLET_LOAD_BALANCE",
    payload: { accountID, balance }
  };
};

export const loadNetwork = (accountID: string, networkId: number | undefined) => {
  return {
    type: "HYDRO_WALLET_LOAD_NETWORK",
    payload: {
      accountID,
      networkId
    }
  };
};

export const selectAccount = (accountID: string, type: string) => {
  return async (dispatch: any, getState: any) => {
    window.localStorage.setItem("HydroWallet:lastSelectedWalletType", type);
    window.localStorage.setItem("HydroWallet:lastSelectedAccountID", accountID);

    await dispatch({
      type: "HYDRO_WALLET_SELECT_ACCOUNT",
      payload: { accountID }
    });
    const wallet = getWallet(getState(), accountID);
    if (wallet) {
      dispatch(watchWallet(wallet));
    }
  };
};

export const supportExtensionWallet = () => {
  return {
    type: "HYDRO_WALLET_SUPPORT_EXTENSION_WALLET"
  };
};

export const lockAccount = (accountID: string) => {
  return {
    type: "HYDRO_WALLET_LOCK_ACCOUNT",
    payload: { accountID }
  };
};

export const unlockAccount = (accountID: string) => {
  return {
    type: "HYDRO_WALLET_UNLOCK_ACCOUNT",
    payload: { accountID }
  };
};

export const unlockBrowserWalletAccount = (account: AccountState, password: string) => {
  return async (dispatch: any) => {
    const hydroWallet = account.get("wallet") as HydroWallet;
    if (hydroWallet) {
      await hydroWallet.unlock(password);
      dispatch(updateWallet(hydroWallet));
      dispatch(unlockAccount(hydroWallet.id()));
    }
  };
};

export const deleteBrowserWalletAccount = (account: AccountState) => {
  return async (dispatch: any) => {
    const hydroWallet = account.get("wallet") as HydroWallet;
    const isLocked = account.get("isLocked");
    if (hydroWallet && !isLocked) {
      const accountID = hydroWallet.id();
      clearTimer(accountID);
      dispatch({ type: "HYDRO_WALLET_DELETE_ACCOUNT", payload: { accountID } });
      await hydroWallet.delete();
    }
  };
};

export const showWalletModal = () => {
  return {
    type: "HYDRO_WALLET_SHOW_DIALOG"
  };
};

export const hideWalletModal = () => {
  return {
    type: "HYDRO_WALLET_HIDE_DIALOG"
  };
};

export const loadWallet = (type: string, action?: any) => {
  return (dispatch: any, getState: any) => {
    const LocalWallet = getState().EthWalletReducer.get("LocalWallet") || HydroWallet;
    switch (type) {
      case ExtensionWallet.TYPE:
        return dispatch(loadExtensionWallet());
      case LocalWallet.TYPE:
        return dispatch(loadLocalWallets());
      case WalletConnectWallet.TYPE:
        return dispatch(loadWalletConnectWallet());
      default:
        if (action) {
          return action();
        }
        return;
    }
  };
};

export const loadCoinbaseWallet = (appName?: string, appLogoUrl?: string) => {
  return async (dispatch: any) => {
    try {
      dispatch(connectWallet(CoinbaseWallet.TYPE));
      const networkId = await getNetworkID();
      const wallet = new CoinbaseWallet(networkId, appName, appLogoUrl);
      await wallet.enable();
      dispatch(watchWallet(wallet));
    } catch (e) {
      dispatch(connectWalletFinished(CoinbaseWallet.TYPE));
      throw e;
    }
  };
};

export const loadDcentWallet = (dcent: any) => {
  return async (dispatch: any) => {
    try {
      dispatch(connectWallet(Dcent.TYPE));
      const wallet = new Dcent(dcent);
      await wallet.reconnect();
      dispatch(watchWallet(wallet));
    } catch (e) {
      dispatch(connectWalletFinished(Dcent.TYPE));
      throw e;
    }
  };
};

export const loadFortmaticWallet = (apiKey: string) => {
  return async (dispatch: any) => {
    try {
      dispatch(connectWallet(Fortmatic.TYPE));
      const wallet = new Fortmatic(apiKey);
      await wallet.enable();
      dispatch(watchWallet(wallet));
    } catch (e) {
      dispatch(connectWalletFinished(Fortmatic.TYPE));
      throw e;
    }
  };
};

// export const loadTorus = () => {
//   return async (dispatch: any) => {
//     try {
//       dispatch(connectWallet(Torus.TYPE));
//       const wallet = new Torus();
//       await wallet.enable();
//       dispatch(watchWallet(wallet));
//     } catch (e) {
//       dispatch(connectWalletFinished(Torus.TYPE));
//       throw e;
//     }
//   };
// };

export const loadExtensionWallet = () => {
  return async (dispatch: any) => {
    let wallet;
    if (typeof window !== "undefined" && (window.ethereum || window.web3)) {
      wallet = new ExtensionWallet();
      await wallet.enable();
    }

    if (wallet && wallet.isSupported()) {
      dispatch(supportExtensionWallet());
      dispatch(watchWallet(wallet));
    } else {
      window.setTimeout(() => dispatch(loadExtensionWallet()), 1000);
    }
  };
};

export const loadWalletConnectWallet = () => {
  return async (dispatch: any) => {
    let wallet = new WalletConnectWallet({ bridge: "" });

    if (!wallet.connector.connected) {
      await wallet.connector.createSession();
    }
    dispatch(watchWallet(wallet));
    const accountID = wallet.id();

    wallet.connector.on("connect", async (error, payload) => {
      if (error) {
        throw error;
      }

      const addresses = await wallet.getAddresses();

      dispatch(unlockAccount(accountID));
      dispatch(selectAccount(accountID, wallet.type()));
      dispatch(loadAddress(accountID, addresses[0]));
      dispatch(loadNetwork(accountID, payload.params[0].chainId));
    });

    wallet.connector.on("session_update", (error, payload) => {
      if (error) {
        throw error;
      }

      // get updated accounts and chainId
      const { accounts, chainId } = payload.params[0];

      dispatch(loadAddress(accountID, accounts[0]));
      dispatch(loadNetwork(accountID, chainId));
    });

    wallet.connector.on("disconnect", async (error, payload) => {
      if (error) {
        throw error;
      }

      window.location.reload();
    });
  };
};

export const loadLocalWallets = () => {
  return (dispatch: any, getState: any) => {
    const LocalWallet = getState().EthWalletReducer.get("LocalWallet") || HydroWallet;
    LocalWallet.list().map((wallet: any) => {
      dispatch(watchWallet(wallet));
    });
  };
};

export const loadLedger = () => {
  return async (dispatch: any) => {
    try {
      dispatch(connectWallet(Ledger.TYPE));
      const wallet = new Ledger();
      await wallet.enable();
      dispatch(watchWallet(wallet));
    } catch (e) {
      dispatch(connectWalletFinished(Ledger.TYPE));
      throw e;
    }
  };
};

export const loadTrezor = () => {
  return async (dispatch: any) => {
    try {
      dispatch(connectWallet(Trezor.TYPE));
      const wallet = new Trezor();
      dispatch(watchWallet(wallet));
    } catch (e) {
      dispatch(connectWalletFinished(Ledger.TYPE));
      throw e;
    }
  };
};

export const connectWallet = (type: string) => {
  return {
    type: "HYDRO_WALLET_CONNECT_WALLET",
    payload: { type }
  };
};

export const connectWalletFinished = (type: string) => {
  return {
    type: "HYDRO_WALLET_CONNECT_WALLET_FINISHED",
    payload: { type }
  };
};

export const watchWallet = (wallet: BaseWallet) => {
  return async (dispatch: any, getState: any) => {
    const accountID = wallet.id();
    const type = wallet.type();

    if (isTimerExist(accountID)) {
      clearTimer(accountID);
    }

    if (!getAccount(getState(), accountID)) {
      await dispatch(initAccount(accountID, wallet));
    } else {
      await dispatch(updateWallet(wallet));
    }

    const watchAddress = async () => {
      const timerKey = TIMER_KEYS.ADDRESS;
      let address;
      try {
        const addresses: string[] = await wallet.getAddresses();
        address = addresses.length > 0 ? addresses[0].toLowerCase() : null;
      } catch (e) {
        if (
          type === Ledger.TYPE ||
          type === Dcent.TYPE ||
          type === Fortmatic.TYPE ||
          // type === Torus.TYPE ||
          type === CoinbaseWallet.TYPE ||
          type === Trezor.TYPE
        ) {
          clearTimer(accountID);
          throw e;
        } else if (e !== NeedUnlockWalletError && e !== NotSupportedError) {
          throw e;
        }
        address = null;
      } finally {
        dispatch(connectWalletFinished(type));
      }

      const walletIsLocked = wallet.isLocked(address);
      const walletStoreLocked = getState().EthWalletReducer.getIn(["accounts", accountID, "isLocked"]);
      if (walletIsLocked !== walletStoreLocked) {
        dispatch(walletIsLocked ? lockAccount(accountID) : unlockAccount(accountID));
      }

      const currentAddressInStore = getState().EthWalletReducer.getIn(["accounts", accountID, "address"]);
      if (currentAddressInStore !== address) {
        dispatch(loadAddress(accountID, address));
        const lastSelectedAccountID = window.localStorage.getItem("HydroWallet:lastSelectedAccountID");
        const currentSelectedAccountID = getState().EthWalletReducer.get("selectedAccountID");
        if (!currentSelectedAccountID && (lastSelectedAccountID === accountID || !lastSelectedAccountID)) {
          dispatch(selectAccount(accountID, type));
        }
      }
      const selectedAccountID = getState().EthWalletReducer.get("selectedAccountID");
      const selectedWalletType = getState().EthWalletReducer.get("selectedWalletType");
      if (
        address &&
        accountID !== selectedAccountID &&
        type === selectedWalletType &&
        (type === CoinbaseWallet.TYPE || type === Dcent.TYPE || type === Fortmatic.TYPE)
      ) {
        dispatch(selectAccount(accountID, type));
      }

      const nextTimer = window.setTimeout(() => watchAddress(), 3000);
      setTimer(accountID, timerKey, nextTimer);
    };

    const watchBalance = async () => {
      const timerKey = TIMER_KEYS.BALANCE;

      const address = getState().EthWalletReducer.getIn(["accounts", accountID, "address"]);
      if (address) {
        try {
          const balance = await wallet.getBalance(address);
          const balanceInStore = getState().EthWalletReducer.getIn(["accounts", accountID, "balance"]);

          if (balance.toString() !== balanceInStore.toString()) {
            dispatch(loadBalance(accountID, balance));
          }
        } catch (e) {
          if (e !== NeedUnlockWalletError && e !== NotSupportedError) {
            throw e;
          }
        }
      }
      const currentSelectedAccountID = getState().EthWalletReducer.get("selectedAccountID");
      const watcherRate = getWatcherRate(currentSelectedAccountID, accountID);
      const nextTimer = window.setTimeout(() => watchBalance(), watcherRate);
      setTimer(accountID, timerKey, nextTimer);
    };

    const watchNetwork = async () => {
      const timerKey = TIMER_KEYS.NETWORK;
      try {
        const networkId = await wallet.loadNetworkId();
        if (networkId && networkId !== getState().EthWalletReducer.getIn(["accounts", accountID, "networkId"])) {
          dispatch(loadNetwork(accountID, networkId));
        } else {
          const nextTimer = window.setTimeout(() => watchNetwork(), 3000);
          setTimer(accountID, timerKey, nextTimer);
        }
      } catch (e) {
        if (e !== NeedUnlockWalletError && e !== NotSupportedError) {
          throw e;
        }
      }
    };

    Promise.all([watchAddress(), watchBalance(), watchNetwork()]);
  };
};

const getWatcherRate = (selectedType: string, type: string) => {
  return selectedType === type && window.document.visibilityState !== "hidden" ? 60000 : 300000;
};
