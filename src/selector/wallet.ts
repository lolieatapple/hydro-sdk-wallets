import { AccountState, WalletState } from "../reducers/wallet";
import { BaseWallet } from "../wallets";

export const getAccounts = (state: { EthWalletReducer: WalletState }): Map<string, AccountState> | null => {
  return state.EthWalletReducer.getIn(["accounts"], null);
};

export const getSelectedAccount = (state: { EthWalletReducer: WalletState }): AccountState | null => {
  const selectedAccountID = state.EthWalletReducer.get("selectedAccountID");

  if (!selectedAccountID) {
    return null;
  }

  return state.EthWalletReducer.getIn(["accounts", selectedAccountID], null);
};

export const getAccount = (
  state: {
    EthWalletReducer: WalletState;
  },
  accountID: string
): AccountState | null => {
  return state.EthWalletReducer.getIn(["accounts", accountID], null);
};

export const getSelectedAccountWallet = (state: { EthWalletReducer: WalletState }): BaseWallet | null => {
  const selectedAccount = getSelectedAccount(state);
  return selectedAccount && selectedAccount.get("wallet", null);
};

export const getWallet = (
  state: {
    EthWalletReducer: WalletState;
  },
  accountID: string
): BaseWallet | null => {
  return state.EthWalletReducer.getIn(["accounts", accountID, "wallet"], null);
};
