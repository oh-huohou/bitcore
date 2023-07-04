import _ from 'lodash';
import { logger } from './lib/logger';

const Config = () => {
  let defaultConfig = {
    basePath: '/bws/api',
    disableLogs: false,
    port: 3232,

    //存储选项对象
    storageOpts: {
      mongoDb: {
        uri: 'mongodb://localhost:27017/bws',
        dbname: 'bws'
      }
    },
    //消息代理选项对象
    messageBrokerOpts: {
      messageBrokerServer: {
        url: 'http://localhost:3380'
      }
    },
    //区块链浏览器选项对象
    blockchainExplorerOpts: {
      btc: {
        livenet: {
          url: 'https://api.bitcore.io'
        },
        testnet: {
          url: 'https://api.bitcore.io',
          regtestEnabled: false
        }
      },
      bch: {
        livenet: {
          url: 'https://api.bitcore.io'
        },
        testnet: {
          url: 'https://api.bitcore.io'
        }
      },
      eth: {
        livenet: {
          url: 'https://api-eth.bitcore.io'
        },
        testnet: {
          url: 'https://api-eth.bitcore.io'
        }
      },
      matic: {
        livenet: {
          url: 'https://api-matic.bitcore.io'
        },
        testnet: {
          url: 'https://api-matic.bitcore.io'
        }
      },
      xrp: {
        livenet: {
          url: 'https://api-xrp.bitcore.io'
        },
        testnet: {
          url: 'https://api-xrp.bitcore.io'
        }
      },
      doge: {
        livenet: {
          url: 'https://api.bitcore.io'
        },
        testnet: {
          url: 'https://api.bitcore.io'
        }
      },
      ltc: {
        livenet: {
          url: 'https://api.bitcore.io'
        },
        testnet: {
          url: 'https://api.bitcore.io'
        }
      },
      socketApiKey: 'socketApiKey'
    },
    //推送通知选项对象
    pushNotificationsOpts: {
      templatePath: 'templates',
      defaultLanguage: 'en',
      defaultUnit: 'btc',
      subjectPrefix: '',
      pushServerUrl: 'https://fcm.googleapis.com/fcm',
      pushServerUrlBraze: 'https://rest.iad-05.braze.com',
      authorizationKey: 'You_have_to_put_something_here',
      authorizationKeyBraze: 'You_have_to_put_something_here'
    },
    //法币汇率服务选项对象
    fiatRateServiceOpts: {
      defaultProvider: 'BitPay',
      fetchInterval: 5 // in minutes
    },
    //维护选项对象
    maintenanceOpts: {
      //维护模式
      maintenanceMode: false
    },
    services: {
      //购买
      buyCrypto: {
        disabled: false,
        moonpay: {
          disabled: false,
          removed: false
        },
        ramp: {
          disabled: false,
          removed: false
        },
        simplex: {
          disabled: false,
          removed: false
        },
        wyre: {
          disabled: false,
          removed: false
        }
      },
      //交换
      swapCrypto: { 
        disabled: false,
        changelly: {
          disabled: false,
          removed: false
        }
      },
    },
    //暂停使用的链列表
    suspendedChains: [],
    //静态资源跟路径
    staticRoot: '/tmp/static'
  };

  // Override default values with bws.config.js' values, if present
  try {
    const bwsConfig = require('../bws.config');
    //加载 bws.config.js 文件并将其中的配置信息与默认配置信息合并，以覆盖默认值。如果 bws.config.js 文件不存在，则使用默认配置信息。
    defaultConfig = _.merge(defaultConfig, bwsConfig);
  } catch {
    logger.info('bws.config.js not found, using default configuration values');
  }
  return defaultConfig;
};

module.exports = Config();
