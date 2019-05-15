import * as React from "react";
import { HydroWallet } from "../../../wallets";
import { connect } from "react-redux";
import Input from "../Input";
import { setWalletStep, WALLET_STEPS, cacheWallet, loadHydroWallet } from "../../../actions/wallet";
import { translations } from "../../../i18n";

interface Props {
  dispatch: any;
  isRecovery?: boolean;
}

interface State {
  password: string;
  confirmation: string;
  isConfirm: boolean;
  processing: boolean;
  mnemonic: string;
  errorMsg: string | null;
}

class Create extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      mnemonic: "",
      password: "",
      confirmation: "",
      isConfirm: true,
      processing: false,
      errorMsg: null
    };
  }

  public componentDidUpdate(prevProps: Props, prevState: State) {
    const { password, confirmation } = this.state;
    if ((password && confirmation && password !== prevState.password) || confirmation !== prevState.confirmation) {
      this.setState({ isConfirm: password === confirmation });
    }
  }

  private async submit(e: React.FormEvent) {
    const { password, confirmation, mnemonic } = this.state;
    const { dispatch, isRecovery } = this.props;
    e.preventDefault();
    if (password !== confirmation) {
      return;
    }

    this.setState({ processing: true });
    try {
      if (isRecovery) {
        const wallet = await HydroWallet.fromMnemonic(mnemonic, password);
        dispatch(loadHydroWallet(wallet));
        dispatch(setWalletStep(WALLET_STEPS.SELECT));
      } else {
        const wallet = await HydroWallet.createRandom();
        dispatch(cacheWallet(wallet, password));
        dispatch(setWalletStep(WALLET_STEPS.BACKUP));
      }
    } catch (e) {
      this.setState({ processing: false, errorMsg: e.message });
    }
  }

  public render() {
    const { password, confirmation, isConfirm, processing } = this.state;
    return (
      <form className="HydroSDK-form" onSubmit={e => this.submit(e)}>
        {this.renderRecoveryInput()}
        <Input
          label={translations.password}
          text={password}
          handleChange={(password: string) => this.setState({ password })}
        />
        <Input
          label={translations.confirm}
          errorMsg={isConfirm ? "" : translations.confirmErrorMsg}
          text={confirmation}
          handleChange={(confirmation: string) => this.setState({ confirmation })}
        />
        <div className="HydroSDK-desc">{translations.createDesc}</div>
        <button
          className="HydroSDK-submitButton HydroSDK-featureButton"
          type="submit"
          disabled={processing || !password || password !== confirmation}>
          {processing ? <i className="HydroSDK-fa fa fa-spinner fa-spin" /> : null} {translations.next}
        </button>
      </form>
    );
  }

  private renderRecoveryInput() {
    const { mnemonic, errorMsg } = this.state;
    const { isRecovery } = this.props;

    const handleChange = (mnemonic: string) => {
      this.setState({
        mnemonic,
        errorMsg: null
      });
    };

    if (!isRecovery) {
      return null;
    }

    return (
      <Input
        label="Recovery Phrase (12 words separated by space)"
        type="text"
        text={mnemonic}
        errorMsg={errorMsg}
        handleChange={(mnemonic: string) => handleChange(mnemonic)}
      />
    );
  }
}

export default connect()(Create);
