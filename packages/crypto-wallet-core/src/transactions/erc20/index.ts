import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { ETHTxProvider } from '../eth';
import { ERC20Abi, MULTISENDAbi } from './abi';

export class ERC20TxProvider extends ETHTxProvider {
  getERC20Contract(tokenContractAddress: string) {
    const web3 = new Web3();
    const contract = new web3.eth.Contract(ERC20Abi as AbiItem[], tokenContractAddress);
    return contract;
  }

  create(params: {
    recipients: Array<{ address: string; amount: string }>;
    nonce: number;
    gasPrice: number;
    data: string;
    gasLimit: number;
    tokenAddress: string;
    network: string;
    chainId?: number;
    contractAddress?: string;
  }) {
    const { tokenAddress } = params;
    const data = this.encodeData(params);
    const recipients = [{ address: tokenAddress, amount: '0' }];
    const newParams = { ...params, recipients, data };
    return super.create(newParams);
  }

  encodeData(params: {
    recipients: Array<{ address: string; amount: string }>;
    tokenAddress: string;
    contractAddress?: string;
  }) {
    const { tokenAddress, recipients, contractAddress } = params;
    if (recipients.length > 1) {
      const addresses = recipients.map(recipient => recipient.address);
      const amounts = recipients.map(recipient => {
        return Number(recipient.amount).toLocaleString('en', { useGrouping: false });
      });
      const multisendContract = this.getMultiSendContract(contractAddress);
      return multisendContract.methods.sendErc20(tokenAddress, addresses, amounts).encodeABI();
    } else {
      const [{ address, amount }] = params.recipients;
      const amountStr = Number(amount).toLocaleString('en', { useGrouping: false });
      const data = this.getERC20Contract(tokenAddress)
        .methods.transfer(address, amountStr)
        .encodeABI();
      return data;
    }
  }
}
