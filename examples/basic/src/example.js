import React from "react";
import { connect } from "react-redux";
import { Wallet, getSelectedAccount, WalletButton, getSelectedAccountWallet } from "eth-sdk-wallet";
// import { Wallet, getSelectedAccount, WalletButton, getSelectedAccountWallet } from "@gongddex/hydro-sdk-wallet";
import "eth-sdk-wallet/index.css";
// import "@gongddex/hydro-sdk-wallet/index.css";
class Example extends React.Component {
  renderAccount(account) {
    return (
      <p>
        Address: {account.get("address")}
        <br />
        IsLock: {account.get("isLocked").toString()}
        <br />
        Eth Balance: {account.get("balance").toString()}
        <br />
        <br />
        <button
          className="HydroSDK-button"
          onClick={() =>
            this.props.selectedWallet
              .signPersonalMessage("Test Message")
              .then(alert, alert)
          }>
          Sign "Test Message"
        </button>
        <button onClick={() => {
          console.log('enable')
          window.ethereum.enable().then(() => {
            window.ethereum.request({ method: 'eth_requestAccounts' });
          })
        }}>Enable</button>
        <button
          onClick={() => {
            console.log('use window 0');

            window.ethereum.request({ method: 'eth_requestAccounts' }).then(console.log);
            let txParam = {
              from: "0x4cf0a877e906dead748a41ae7da8c220e4247d9e",
              to: "0x1b95d8e5a5ea04908591c1b98a936b424705a959",
              // to: "0x0000000000000000000000000000000000000000",
              // gasLimit: "0xF4240",
              // gasPrice: "0x0x2540BE400",
              value: '0x0',
              data: "0x095ea7b30000000000000000000000000eab0c80a6819fed0986014d0bd077040fe846f1f000000000000000000000000000000000000000000000000000000000000000",
            }

            const method = 'eth_sendTransaction'
            const params = [txParam];
            console.log('use window444');
            // window.ethereum.request({ method, params })
            //   .then((txHash) => {

            //     alert('Thank you for your generosity!'+txHash)

            //     // You can poll the blockchain to see when this transaction has been mined:
            //   })
            //   .catch((error) => {
            //     if (error.code === 4001) { // 4001: User rejected request
            //       return alert(`We can't take your money without your permission.`)
            //     }
            //     alert('There was an issue, please try again.')
            //     console.log(error);
            //   })

            // const tx = {
            //   from: "0x4cf0a877e906dead748a41ae7da8c220e4247d9e",
            //   to: "0x0000000000000000000000000000000000000000",
            //   // nonce: 1,
            //   gas: "0xF4240",
            //   value: "0x0",
            //   data: "0x0"
            // };

            // const functionSelector = '095ea7b3';
            // let spender = this.get64BytesString('0x0EaB0C80a6819FEd0986014d0Bd077040FE846f1');
            // let allowance = 'f000000000000000000000000000000000000000000000000000000000000000';

            // txParam.data = `0x${functionSelector}${spender}${allowance}`,

            this.props.selectedWallet
              .sendTransaction(txParam)
              .then(alert, alert).catch(alert);
          }
          }>
          Debug SendTransaction
        </button>
      </p>
    );
  }

  get64BytesString(string) {
    string = string.replace('0x', '');
    while (string.length < 64) {
      string = '0'.concat(string);
    }
    return string;
  };

  render() {
    const { selectedAccount } = this.props;
    return (
      <div>
        <h2>Basic Example</h2>
        <Wallet title="Basic Wallet Demo" nodeUrl="https://rinkeby.infura.io/v3/f977681c79004fad87aa00da8f003597" />
        <WalletButton />

        <h2>Info</h2>
        <div>{selectedAccount ? this.renderAccount(selectedAccount) : <p>No selected Account</p>}</div>
      </div>
    );
  }
}

export default connect(state => {
  return {
    selectedAccount: getSelectedAccount(state),
    selectedWallet: getSelectedAccountWallet(state),
  };
})(Example);
