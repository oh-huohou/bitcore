# Bitcore Wallet Service

[![NPM Package](https://img.shields.io/npm/v/bitcore-wallet-service.svg?style=flat-square)](https://www.npmjs.org/package/bitcore-wallet-service)
[![Build Status](https://img.shields.io/travis/bitpay/bitcore-wallet-service.svg?branch=master&style=flat-square)](https://travis-ci.org/bitpay/bitcore-wallet-service)
[![Coverage Status](https://coveralls.io/repos/bitpay/bitcore-wallet-service/badge.svg?branch=master)](https://coveralls.io/r/bitpay/bitcore-wallet-service?branch=master)

**A Multisig HD Bitcore Wallet Service.**

## 描述

Bitcore Wallet Service通过一个（希望）简单直观的REST API，方便创建和操作多签名HD钱包。

BWS通常可以在几分钟内安装完成，并提供了所有必要的基础设施，以便多签名钱包中的对等节点进行通信和操作，同时最小化服务器的信任。

请参考[bitcore-wallet-client](https://github.com/bitpay/bitcore/tree/master/packages/bitcore-wallet-client)，这是与BWS通信并验证其响应的官方客户端库。同时也可以查看[bitcore-wallet](https://github.com/bitpay/bitcore/tree/master/packages/bitcore-wallet)，这是一个依赖BWS的简单CLI钱包实现。

BWS已经在生产环境中被用于[Copay钱包](https://copay.io)、[Bitpay App钱包](https://bitpay.com/wallet)等应用。

关于BWS的更多信息，请访问https://blog.bitpay.com/announcing-the-bitcore-wallet-suite/。

## 开始

```sh
 git clone https://github.com/bitpay/bitcore-wallet-service.git
 cd bitcore-wallet-service
 npm install
 npm start
```

这将在http://localhost:3232/bws/api上启动BWS服务（使用默认设置）。

BWS需要mongoDB。您可以在bws.config.js中配置连接。

BWS支持SSL和集群。有关安装带有额外功能的BWS的详细指南，请参阅[Installing BWS](https://github.com/bitpay/bitcore/blob/master/packages/bitcore-wallet-service/installation.md).

BWS默认使用请求速率限制来限制CreateWallet端点的请求。如果您需要修改它，请查看defaults.js中的Defaults.RateLimit。

## Using BWS with PM2

BWS can be used with PM2 with the provided `app.js` script:

```sh
  pm2 start app.js --name "bitcoin-wallet-service"
```

## 安全注意事项
- 私钥永远不会被发送到BWS。Copayers将其存储在本地。
- 扩展公钥存储在BWS上。这使得BWS可以轻松检查钱包余额，向copayers发送离线通知等。
- 在创建钱包时，初始的copayer创建一个包含私钥的钱包秘钥。所有的copayers需要使用该私钥对他们的信息进行签名，以证明他们拥有这个秘钥。应该通过安全的渠道共享这个秘钥。
- 一个copayer可以多次加入钱包，目前没有机制可以阻止这种情况发生。可以查看[钱包]((https://github.com/bitpay/bitcore/tree/master/packages/bitcore-wallet))的确认命令，以确认copayers的方法。
- 所有的BWS响应都经过验证：
  - 地址和找零地址由copayers根据本地数据独立生成和验证。
  - 交易提案模板由copayers签名并由其他人验证，因此BWS无法创建或篡改它们。

## Using SSL

You can add your certificates at the bws.config.js using:

```json
  https: true,
  privateKeyFile: 'private.pem',
  certificateFile: 'cert.pem',
  ////// The following is only for certs which are not
  ////// trusted by nodejs 'https' by default
  ////// CAs like Verisign do not require this
  // CAinter1: '', // ex. 'COMODORSADomainValidationSecureServerCA.crt'
  // CAinter2: '', // ex. 'COMODORSAAddTrustCA.crt'
  // CAroot: '', // ex. 'AddTrustExternalCARoot.crt'
```

@dabura667 made a report about how to use letsencrypt with BWS: https://github.com/bitpay/bitcore-wallet-service/issues/423

## 交易提案的生命周期

交易提案需要经历以下步骤：

1. 首先通过 /v?/txproposal 进行创建
   -> 这将创建一个“临时”的交易提案，返回该对象，但不锁定输入。
2. 然后通过 /v?/txproposal/:id/publish 进行发布
   -> 这将向所有的copayers发布交易提案，并锁定输入。已发布的交易提案也可以被“删除”。
3. 然后针对每个copayer通过 /v?/txproposal/:id/signature 进行签名
4. 然后通过 /v?/txproposal/:id/broadcast 将交易提案广播到P2P网络中

在 /test/integration 代码中有很多创建和发送交易提案的示例。

## 启用 BWS 和 Copay 的 Regtest 模式

### 要求

- 在 http://localhost:3000 上运行 bitcore-node
- 在 http://localhost:3232/bws/api 上本地运行 bws
- 运行 mongod
- 在端口 8100 上运行 copay
- 在 regtest 模式下运行 bitcoin-core（蓝色图标标识）

> 由于通知在 Web 浏览器中不兼容，mongo topology 有时会崩溃。
> **bitcore-wallet-service/lib/notificationbroadcaster.js
> 注意：如果在 PC 浏览器上进行测试，请将 notificationbroadcaster.js 注释掉以禁用通知。

### Steps:

**bitcore.config.json**

1.  Add regtest to bitcore.config.json.

```
"regtest": {
          "chainSource": "p2p",
          "trustedPeers": [
            {
              "host": "127.0.0.1",
              "port": 20020
            }
          ],
          "rpc": {
            "host": "127.0.0.1",
            "port": 20021,
            "username": "bitpaytest",
            "password": "local321"
          }
        }
```

**bitcore-wallet-service/bws.config.js**

2. Point testnet to http://localhost:3000 in BWS/bws.config.js and set regtestEnabled to true.

```
blockchainExplorerOpts: {
    btc: {
      livenet: {
        url: 'https://api.bitcore.io'
      },
      testnet: {
        // set url to http://localhost:3000 here
        url: 'http://localhost:3000',
        // set regtestEnabled to true here
        regtestEnabled: true
      }
    },
...
```

### Copay changes

**copay/app-template/index-template.html**

3. 在<head>标签中将内容安全性的元标记注释掉。

```
// <meta http-equiv="Content-Security-Policy" content="default-src 'self'  ... >
```

## 在 regtest 网络上创建钱包

### Steps:

1. Set the wallet service URL to

```
http://localhost:3232/bws/api
```

2. 通过点击滑动按钮选择 Testnet。

<img width="923" alt="screen shot 2019-03-06 at 10 50 29 am" src="https://user-images.githubusercontent.com/23103037/53894324-e69f8300-3ffd-11e9-9b25-145332fe860c.png">

## Testing on mobile

Requirements:

- Mobile phone and PC must be connected to the same internet
- PC desktop ip address for localhost

To find ip address for PC run:

```
// 127.0.0.1 is equal to localhost
ifconfig | grep "inet " | grep -v 127.0.0.1
```

1. Inside copay project root directory run:

```
npm run apply:copay
```

2. Enter PC ip address followed by port in the mobile phone browser:

```
10.10.11.73:8100
```

3. Set wallet service url to PC ip address /bws/api when creating a new wallet

```
http://10.10.11.73:3232/bws/api
```

# REST API

注意：所有货币金额以聪（satoshi）为单位（相当于比特币的1/100,000,000）。

## Authentication

In order to access a wallet, clients are required to send the headers:

```sh
  x-identity
  x-signature
```
身份是对等标识（Peer-ID），它将标识对等方及其钱包。签名是当前请求的签名，使用requestSigningKey，即扩展私钥的m/1/1派生。

有关实现的详细信息，请参见 [Bitcore Wallet Client](https://github.com/bitpay/bitcore/tree/master/packages/bitcore-wallet-client)。

## GET Endpoints

### `/v1/wallets/`: Get wallet information

Returns:

- Wallet object. (see [fields on the source code](https://github.com/bitpay/bitcore/blob/master/packages/bitcore-wallet-service/src/lib/model/wallet.ts)).

### `/v1/txhistory/`: Get Wallet's transaction history

Optional Arguments:

- skip: Records to skip from the result (defaults to 0)
- limit: Total number of records to return (return all available records if not specified).

Returns:

- History of incoming and outgoing transactions of the wallet. The list is paginated using the `skip` & `limit` params. Each item has the following fields:
- action ('sent', 'received', 'moved')
- amount
- fees
- time
- addressTo
- confirmations
- proposalId
- creatorName
- message
- actions array ['createdOn', 'type', 'copayerId', 'copayerName', 'comment']

### `/v2/txproposals/`: Get Wallet's pending transaction proposals and their status

Returns:

- List of pending TX Proposals. (see [fields on the source code](https://github.com/bitpay/bitcore/blob/master/packages/bitcore-wallet-service/src/lib/model/txproposal.ts))

- Uses cashaddr without prefix for BCH

### `/v4/addresses/`: Get Wallet's main addresses (does not include change addresses)

Optional Arguments:

- ignoreMaxGap: [false] Ignore checking less that 20 unused addresses (BIP44 GAP)

Returns:

- List of Addresses object: (https://github.com/bitpay/bitcore/blob/master/packages/bitcore-wallet-service/src/lib/model/address.ts). This call is mainly provided so the client check this addresses for incoming transactions (using a service like [Insight](https://insight.bitcore.io)
- Returns cashaddr without prefix for BCH

### `/v1/balance/`: Get Wallet's balance

Returns:

- totalAmount: Wallet's total balance
- lockedAmount: Current balance of outstanding transaction proposals, that cannot be used on new transactions.
- availableAmount: Funds available for new proposals.
- totalConfirmedAmount: Same as totalAmount for confirmed UTXOs only.
- lockedConfirmedAmount: Same as lockedAmount for confirmed UTXOs only.
- availableConfirmedAmount: Same as availableAmount for confirmed UTXOs only.
- byAddress array ['address', 'path', 'amount']: A list of addresses holding funds.
- totalKbToSendMax: An estimation of the number of KiB required to include all available UTXOs in a tx (including unconfirmed).

### `/v1/txnotes/:txid`: Get user notes associated to the specified transaction

Returns:

- The note associated to the `txid` as a string.

### `/v1/fiatrates/:code`: Get the fiat rate for the specified ISO 4217 code

Optional Arguments:

- provider: An identifier representing the source of the rates.
- ts: The timestamp for the fiat rate (defaults to now).

Returns:

- The fiat exchange rate.

## POST Endpoints

### `/v1/wallets/`: Create a new Wallet

Required Arguments:

- name: Name of the wallet
- m: Number of required peers to sign transactions
- n: Number of total peers on the wallet
- pubKey: Wallet Creation Public key to check joining copayer's signatures (the private key is unknown by BWS and must be communicated
  by the creator peer to other peers).

Returns:

- walletId: Id of the new created wallet

### `/v1/wallets/:id/copayers/`: Join a Wallet in creation

Required Arguments:

- walletId: Id of the wallet to join
- name: Copayer Name
- xPubKey - Extended Public Key for this copayer.
- requestPubKey - Public Key used to check requests from this copayer.
- copayerSignature - Signature used by other copayers to verify that the copayer joining knows the wallet secret.

Returns:

- copayerId: Assigned ID of the copayer (to be used on x-identity header)
- wallet: Object with wallet's information

### `/v3/txproposals/`: Add a new temporary transaction proposal

Required Arguments:

- toAddress: RCPT Bitcoin address.
- amount: amount (in satoshis) of the mount proposed to be transfered
- proposalsSignature: Signature of the proposal by the creator peer, using proposalSigningKey.
- (opt) message: Encrypted private message to peers.
- (opt) payProUrl: Paypro URL for peers to verify TX
- (opt) feePerKb: Use an alternative fee per KB for this TX.
- (opt) excludeUnconfirmedUtxos: Do not use UTXOs of unconfirmed transactions as inputs for this TX.
- BCH addresses need to be cashaddr without prefix.

Returns:

- TX Proposal object. (see [fields on the source code]https://github.com/bitpay/bitcore/blob/master/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)). `.id` is probably needed in this case.

### `/v2/txproposals/:id/publish`: Publish the previously created `temporary` tx proposal

Returns:

- TX Proposal object. (see [fields on the source code](https://github.com/bitpay/bitcore/blob/master/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)).

### `/v3/addresses/`: Request a new main address from wallet . (creates an address on normal conditions)

Returns:

- Address object: (https://github.com/bitpay/bitcore/blob/master/packages/bitcore-wallet-service/src/lib/model/address.ts). Note that `path` is returned so client can derive the address independently and check server's response.

### `/v1/txproposals/:id/signatures/`: Sign a transaction proposal

Required Arguments:

- signatures: All Transaction's input signatures, in order of appearance.

Returns:

- TX Proposal object. (see [fields on the source code](https://github.com/bitpay/bitcore/blob/master/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)). `.status` is probably needed in this case.

### `/v1/txproposals/:id/broadcast/`: Broadcast a transaction proposal

Returns:

- TX Proposal object. (see [fields on the source code](https://github.com/bitpay/bitcore/blob/master/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)). `.status` is probably needed in this case.

### `/v1/txproposals/:id/rejections`: Reject a transaction proposal

Returns:

- TX Proposal object. (see [fields on the source code](https://github.com/bitpay/bitcore/blob/master/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)). `.status` is probably needed in this case.

### `/v1/addresses/scan`: Start an address scan process looking for activity.

Optional Arguments:

- includeCopayerBranches: Scan all copayer branches following BIP45 recommendation (defaults to false).

### `/v1/txconfirmations/`: Subscribe to receive push notifications when the specified transaction gets confirmed

Required Arguments:

- txid: The transaction to subscribe to.

## PUT Endpoints

### `/v1/txnotes/:txid/`: Modify a note for a tx

## DELETE Endpoints

### `/v1/txproposals/:id/`: Deletes a transaction proposal. Only the creator can delete a TX Proposal, and only if it has no other signatures or rejections

Returns:

- TX Proposal object. (see [fields on the source code](https://github.com/bitpay/bitcore/blob/master/packages/bitcore-wallet-service/src/lib/model/txproposal.ts)). `.id` is probably needed in this case.

### `/v1/txconfirmations/:txid`: Unsubscribe from transaction `txid` and no longer listen to its confirmation

# Push Notifications

Recomended to complete config.js file:

- [FCM documentation](https://firebase.google.com/docs/cloud-messaging/)
- [Apple's Notification](https://developer.apple.com/documentation/usernotifications)

## POST Endpoints

### `/v1/pushnotifications/subscriptions/`: Adds subscriptions for push notifications service at database

## DELETE Endpoints

### `/v2/pushnotifications/subscriptions/`: Remove subscriptions for push notifications service from database

## Contributing

See [CONTRIBUTING.md](https://github.com/bitpay/bitcore/blob/master/Contributing.md) on the main bitcore repo for information about how to contribute.

## License

Code released under [the MIT license](https://github.com/bitpay/bitcore/blob/master/LICENSE).

Copyright 2013-2019 BitPay, Inc. Bitcore is a trademark maintained by BitPay, Inc.
