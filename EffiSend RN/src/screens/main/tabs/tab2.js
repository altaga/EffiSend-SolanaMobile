import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {PublicKey} from '@solana/web3.js';
import {formatUnits} from 'ethers';
import {Component, Fragment} from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import VirtualKeyboard from 'react-native-virtual-keyboard';
import {fetchFaceID} from '../../../api/fetchFaceID';
import {fetchPayment} from '../../../api/fetchPayment';
import checkMark from '../../../assets/images/checkMark.png';
import CamFace from '../../../components/camFace';
import CamQR from '../../../components/camQR';
import {blockchain} from '../../../core/constants';
import {
  deleteLeadingZeros,
  formatInputText,
  normalizeFontSize,
  rgbaToHex,
  setAsyncStorageValue,
  setupProvider,
} from '../../../core/utils';
import ContextModule from '../../../providers/contextModule';
import GlobalStyles, {
  mainColor,
  secondaryColor,
  tertiaryColor,
} from '../../../styles/styles';
import {executePayment} from '../../../api/executePayment';
import RNPrint from 'react-native-print';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import QRCode from 'react-native-qrcode-svg';
import {logo} from '../../../assets/images/logo';

const BaseStateTab2 = {
  // Base
  balances: blockchain.tokens.map(() => 0),
  activeTokens: blockchain.tokens.map(() => false),
  stage: 0, // 0
  amount: '0.00', // "0.00"
  kindPayment: 0, // 0
  // wallets
  user: '',
  address: '',
  // Extra
  explorerURL: '',
  hash: '',
  transactionDisplay: {
    amount: '0.00',
    name: blockchain.tokens[0].symbol,
    tokenAddress: blockchain.tokens[0].address,
    icon: blockchain.tokens[0].icon,
    chain: 0,
  },
  destinationChain: 0,
  // QR print
  saveData: '',
  // Utils
  take: false,
  loading: false,
};

class Tab2 extends Component {
  constructor(props) {
    super(props);
    this.state = BaseStateTab2;
    this.provider = setupProvider(blockchain.rpcs);
    this.controller = new AbortController();
    this.svg = null;
  }

  static contextType = ContextModule;

  async getDataURL() {
    return new Promise(async (resolve, reject) => {
      this.svg.toDataURL(async data => {
        this.setState(
          {
            saveData: data,
          },
          () => resolve('ok'),
        );
      });
    });
  }

  async print() {
    try {
      await this.getDataURL();
      const results = await RNHTMLtoPDF.convert({
        html: `
        <div style="text-align: center;">
          <img src='${logo}' width="35%"></img>
          <h1 style="font-size: 3rem;">--------- Original Reciept ---------</h1>
          <h1 style="font-size: 3rem;">Date: ${new Date().toLocaleDateString()}</h1>
          <h1 style="font-size: 3rem;">Type: ${
            this.state.kindPayment === 0 ? 'QR Payment' : 'FaceID Payment'
          }</h1>
          <h1 style="font-size: 3rem;">------------------ • ------------------</h1>
          <h1 style="font-size: 3rem;">Transaction</h1>
          <h1 style="font-size: 3rem;">Amount: ${deleteLeadingZeros(
            formatInputText(this.state.transactionDisplay.amount, 6),
          )} ${this.state.transactionDisplay.name}</h1>
          <h1 style="font-size: 3rem;">------------------ • ------------------</h1>
          <img style="width:70%" src='${
            'data:image/png;base64,' + this.state.saveData
          }'></img>
      </div>
      `,
        fileName: 'print',
        base64: true,
      });
      await RNPrint.print({filePath: results.filePath});
    } catch (e) {
      console.log(e);
    }
  }

  componentDidMount() {
    this.setState(BaseStateTab2);
  }

  async getUSD() {
    const array = blockchain.tokens.map(token => token.coingecko);
    var myHeaders = new Headers();
    myHeaders.append('accept', 'application/json');
    var requestOptions = {
      signal: this.controller.signal,
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    };
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${array.toString()}&vs_currencies=usd`,
      requestOptions,
    );
    const result = await response.json();
    const usdConversion = array.map(x => result[x].usd);
    await setAsyncStorageValue({usdConversion});
    await this.context.setValueAsync({usdConversion});
  }

  async getNativeOrTokenBalance(address, flag) {
    return new Promise(async resolve => {
      let balance = 0n;
      try {
        if (flag) {
          balance = await this.provider.getTokenAccountBalance(address).send();
          balance = BigInt(balance.value.amount);
        } else {
          balance = await this.provider.getBalance(address).send();
          balance = balance.value;
        }
      } catch (e) {
        //console.log(e);
      }
      resolve(balance);
    });
  }

  async getBalances() {
    let tokensAddresses = await Promise.all(
      blockchain.tokens.map(token =>
        getAssociatedTokenAddress(
          new PublicKey(token.address),
          new PublicKey(this.state.address),
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ),
      ),
    );
    tokensAddresses = tokensAddresses.map(x => x.toBase58());
    const tokenBalances = await Promise.all(
      tokensAddresses.map((addressToken, i) =>
        this.getNativeOrTokenBalance(
          i === 0 ? this.state.address : addressToken,
          i !== 0,
        ),
      ),
    );
    const balances = blockchain.tokens.map((token, i) => {
      return formatUnits(tokenBalances[i], token.decimals);
    });
    const activeTokens = balances.map(
      (balance, i) =>
        balance >
        parseFloat(deleteLeadingZeros(formatInputText(this.state.amount))) /
          this.context.value.usdConversion[i],
    );
    await this.setStateAsync({
      balances,
      activeTokens,
    });
  }

  // Utils
  async setStateAsync(value) {
    return new Promise(resolve => {
      this.setState(
        {
          ...value,
        },
        () => resolve(),
      );
    });
  }

  render() {
    return (
      <Fragment>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={[GlobalStyles.scrollContainer]}
          contentContainerStyle={[
            GlobalStyles.scrollContainerContent,
            {width: '90%', alignSelf: 'center'},
          ]}>
          {this.state.stage === 0 && (
            <Fragment>
              <Text style={GlobalStyles.title}>Enter Amount (USD)</Text>
              <Text style={{fontSize: 36, color: 'white'}}>
                {deleteLeadingZeros(formatInputText(this.state.amount))}
              </Text>
              <VirtualKeyboard
                style={{
                  fontSize: 40,
                  textAlign: 'center',
                  marginTop: -10,
                }}
                cellStyle={{
                  width: normalizeFontSize(100),
                  height: normalizeFontSize(50),
                  borderWidth: 1,
                  borderColor: rgbaToHex(255, 255, 255, 20),
                  borderRadius: 5,
                  margin: 3,
                }}
                rowStyle={{
                  width: '100%',
                }}
                color="white"
                pressMode="string"
                onPress={amount => this.setState({amount})}
                decimal
              />
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  width: '100%',
                }}>
                <Pressable
                  style={[
                    GlobalStyles.buttonStyle,
                    {
                      backgroundColor: secondaryColor,
                      borderColor: secondaryColor,
                    },
                  ]}
                  onPress={() => this.setState({stage: 1, kindPayment: 0})}>
                  <Text style={GlobalStyles.buttonText}>Pay with QR</Text>
                </Pressable>
                <Pressable
                  style={[
                    GlobalStyles.buttonStyle,
                    {
                      backgroundColor: tertiaryColor,
                      borderColor: tertiaryColor,
                    },
                  ]}
                  onPress={() => this.setState({stage: 1, kindPayment: 1})}>
                  <Text style={GlobalStyles.buttonText}>Pay with FaceID</Text>
                </Pressable>
              </View>
            </Fragment>
          )}
          {this.state.stage === 1 && this.state.kindPayment === 0 && (
            <Fragment>
              <View style={{alignItems: 'center'}}>
                <Text style={GlobalStyles.title}>Amount (USD)</Text>
                <Text style={{fontSize: 36, color: 'white'}}>
                  $ {deleteLeadingZeros(formatInputText(this.state.amount))}
                </Text>
              </View>
              <View style={{alignItems: 'center'}}>
                <Text style={GlobalStyles.title}>QR Code</Text>
              </View>
              <View
                style={{
                  height: 'auto',
                  width: '90%',
                  marginVertical: 20,
                  borderColor: this.state.loading ? mainColor : secondaryColor,
                  borderWidth: 5,
                  borderRadius: 10,
                  aspectRatio: 1,
                }}>
                <CamQR
                  facing={'back'}
                  callbackAddress={async nonce => {
                    try {
                      await this.setStateAsync({loading: true});
                      const {
                        result: {address, user},
                      } = await fetchPayment({
                        nonce,
                      });
                      await this.setStateAsync({address, user});
                      await this.getUSD();
                      await this.getBalances();
                      await this.setStateAsync({
                        loading: false,
                        stage: 2,
                      });
                    } catch (error) {
                      console.log(error);
                      this.setState(BaseStateTab2);
                    }
                  }}
                />
              </View>
              <View
                key={'This element its only to align the QR reader in center'}
              />
            </Fragment>
          )}
          {this.state.stage === 1 && this.state.kindPayment === 1 && (
            <Fragment>
              <View style={{alignItems: 'center'}}>
                <Text style={GlobalStyles.title}>Amount (USD)</Text>
                <Text style={{fontSize: 36, color: 'white'}}>
                  $ {deleteLeadingZeros(formatInputText(this.state.amount))}
                </Text>
              </View>
              <View>
                <Text style={{color: 'white', fontSize: 28}}>FaceID</Text>
              </View>
              <View
                style={{
                  height: 'auto',
                  width: '90%',
                  marginVertical: 20,
                  borderColor: this.state.loading ? mainColor : secondaryColor,
                  borderWidth: 5,
                  borderRadius: 10,
                  aspectRatio: 1,
                }}>
                <CamFace
                  facing={'back'}
                  take={this.state.take}
                  onImage={async image => {
                    try {
                      const {result: user} = await fetchFaceID({image});
                      const {
                        result: {address},
                      } = await fetchPayment({user});
                      await this.setStateAsync({address, user});
                      await this.getUSD();
                      await this.getBalances();
                      await this.setStateAsync({
                        loading: false,
                        stage: 2,
                      });
                    } catch (error) {
                      console.log(error);
                      this.setState(BaseStateTab2);
                    }
                  }}
                />
              </View>
              <Pressable
                disabled={this.state.loading}
                style={[
                  GlobalStyles.buttonStyle,
                  this.state.loading ? {opacity: 0.5} : {},
                ]}
                onPress={() =>
                  this.setState({take: true, loading: true}, () => {
                    this.setState({
                      take: false,
                    });
                  })
                }>
                <Text style={[GlobalStyles.buttonText]}>
                  {this.state.loading ? 'Processing...' : 'Take Picture'}
                </Text>
              </Pressable>
            </Fragment>
          )}
          {this.state.stage === 2 && (
            <Fragment>
              <Text
                style={{
                  fontSize: 28,
                  color: 'white',
                  textAlign: 'center',
                }}>
                {this.state.address.substring(0, 6)}...
                {this.state.address.substring(this.state.address.length - 4)}
              </Text>
              <Text style={[GlobalStyles.titlePaymentToken]}>
                Select Payment Token
              </Text>
              <View style={{width: '90%', flex: 1}}>
                {blockchain.tokens.map((token, i) =>
                  this.state.activeTokens[i] ? (
                    <View
                      key={`${token.name}-${i}`}
                      style={{
                        paddingBottom: 20,
                        marginBottom: 20,
                      }}>
                      <Pressable
                        disabled={this.state.loading}
                        style={[
                          GlobalStyles.buttonStyle,
                          this.state.loading ? {opacity: 0.5} : {},
                          {
                            backgroundColor: token.color,
                            borderColor: token.color,
                          },
                        ]}
                        onPress={async () => {
                          try {
                            await this.setStateAsync({
                              transactionDisplay: {
                                amount: (
                                  this.state.amount /
                                  this.context.value.usdConversion[i]
                                ).toFixed(6),
                                name: token.symbol,
                                icon: token.icon,
                              },
                              status: 'Processing...',
                              stage: 3,
                              explorerURL: '',
                              loading: true,
                            });
                            const result = await executePayment({
                              user: this.state.user,
                              token: blockchain.tokens[i].address,
                              amount:
                                this.state.amount /
                                this.context.value.usdConversion[i],
                              to: this.context.value.address,
                            });
                            console.log(result);
                            if (result.error === null) {
                              await this.setStateAsync({
                                status: 'Confirmed',
                                loading: false,
                                explorerURL: `${blockchain.blockExplorer}tx/${result.result.hash}`,
                                hash: result.result.hash,
                              });
                            }
                          } catch (error) {
                            console.log(error);
                            await this.setStateAsync({loading: false});
                          }
                        }}>
                        <Text style={GlobalStyles.buttonText}>
                          {token.name}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Fragment key={`${token.name}-${i}`} />
                  ),
                )}
              </View>
            </Fragment>
          )}
          {
            // Stage 3
            this.state.stage === 3 && (
              <Fragment>
                <Image
                  source={checkMark}
                  alt="check"
                  style={{width: '60%', height: 'auto', aspectRatio: 1}}
                />
                <Text
                  style={{
                    textShadowRadius: 1,
                    fontSize: 28,
                    fontWeight: 'bold',
                    color:
                      this.state.explorerURL === ''
                        ? secondaryColor
                        : mainColor,
                  }}>
                  {this.state.explorerURL === ''
                    ? 'Processing...'
                    : 'Completed'}
                </Text>
                <View
                  style={[
                    GlobalStyles.network,
                    {
                      width: '100%',
                      paddingHorizontal: 16,
                    },
                  ]}>
                  <View
                    style={{
                      flexDirection: 'row',
                    }}>
                    <View style={{justifyContent: 'center'}}>
                      <Text style={{fontSize: 20, color: 'white'}}>
                        Transaction
                      </Text>
                      <Text style={{fontSize: 14, color: 'white'}}>
                        {this.state.kindPayment === 0
                          ? 'QR Payment'
                          : 'FaceID Payment'}
                      </Text>
                    </View>
                  </View>
                  {this.state.transactionDisplay.icon}
                  <Text style={{color: 'white'}}>
                    {`${parseFloat(
                      this.state.transactionDisplay.amount,
                    ).toFixed(6)}`}{' '}
                    {this.state.transactionDisplay.name}
                  </Text>
                </View>
                <View style={GlobalStyles.buttonContainer}>
                  <Pressable
                    disabled={this.state.explorerURL === ''}
                    style={[
                      GlobalStyles.buttonStyle,
                      this.state.explorerURL === ''
                        ? {opacity: 0.5, borderColor: 'black'}
                        : {},
                    ]}
                    onPress={() => Linking.openURL(this.state.explorerURL)}>
                    <Text style={GlobalStyles.buttonText}>
                      View on Explorer
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      GlobalStyles.buttonStyle,
                      {
                        backgroundColor: secondaryColor,
                        borderColor: secondaryColor,
                      },
                      this.state.explorerURL === ''
                        ? {opacity: 0.5, borderColor: 'black'}
                        : {},
                    ]}
                    onPress={async () => {
                      this.print();
                    }}
                    disabled={this.state.explorerURL === ''}>
                    <Text style={GlobalStyles.buttonText}>Print Receipt</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      GlobalStyles.buttonStyle,
                      {
                        backgroundColor: tertiaryColor,
                        borderColor: tertiaryColor,
                      },
                      this.state.explorerURL === ''
                        ? {opacity: 0.5, borderColor: 'black'}
                        : {},
                    ]}
                    onPress={async () => {
                      this.setState({
                        stage: 0,
                        explorerURL: '',
                        check: 'Check',
                        errorText: '',
                        amount: '0.00', // "0.00"
                      });
                    }}
                    disabled={this.state.explorerURL === ''}>
                    <Text style={GlobalStyles.buttonText}>Done</Text>
                  </Pressable>
                </View>
              </Fragment>
            )
          }
        </ScrollView>
        <View
          style={{
            position: 'absolute',
            bottom: -(Dimensions.get('screen').height * 1.1),
          }}>
          <QRCode
            value={
              this.state.explorerURL === ''
                ? 'placeholder'
                : this.state.explorerURL
            }
            size={Dimensions.get('window').width * 0.6}
            ecl="L"
            getRef={c => (this.svg = c)}
          />
        </View>
      </Fragment>
    );
  }
}

export default Tab2;
