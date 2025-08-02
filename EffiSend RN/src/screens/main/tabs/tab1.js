import Clipboard from '@react-native-clipboard/clipboard';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { formatUnits, randomBytes, uuidV4 } from 'ethers';
import { Component, Fragment } from 'react';
import {
  Keyboard,
  NativeEventEmitter,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import { Toast } from 'toastify-react-native';
import { createPayment } from '../../../api/createPayment';
import QrAddress from '../../../components/qrAddress';
import { blockchain, refreshTime } from '../../../core/constants';
import {
  arraySum,
  epsilonRound,
  getAsyncStorageValue,
  getEncryptedStorageValue,
  normalizeFontSize,
  setAsyncStorageValue,
  setTokens,
  setupProvider,
} from '../../../core/utils';
import ContextModule from '../../../providers/contextModule';
import GlobalStyles, { mainColor } from '../../../styles/styles';

const baseTab1State = {
  // Transaction settings
  amount: '',
  tokenSelected: setTokens(blockchain.tokens)[0], // ""
  loading: false,
  take: false,
  keyboardHeight: 0,
  selector: 0,
  qrData: '',
  cameraDelayLoading: false, // Force the camera to load when component is mounted and helps UX
};

class Tab1 extends Component {
  constructor(props) {
    super(props);
    this.state = baseTab1State;
    this.provider = setupProvider(blockchain.rpcs);
    this.EventEmitter = new NativeEventEmitter();
    this.controller = new AbortController();
  }

  static contextType = ContextModule;

  async getlastRefresh() {
    try {
      const lastRefresh = await getAsyncStorageValue('lastRefresh');
      if (lastRefresh === null) throw 'Set First Date';
      return lastRefresh;
    } catch (err) {
      await setAsyncStorageValue({lastRefresh: 0});
      return 0;
    }
  }

  async componentDidMount() {
    setTimeout(async () => {
      if (this.context.value.address !== '') {
        // Event Emitter
        this.EventEmitter.addListener('refresh', async () => {
          Keyboard.dismiss();
          await this.setStateAsync(baseTab1State);
          await setAsyncStorageValue({lastRefresh: Date.now()});
          this.refresh();
        });
        // Get Last Refresh
        const lastRefresh = await this.getlastRefresh();
        if (Date.now() - lastRefresh >= refreshTime) {
          console.log('Refreshing...');
          await setAsyncStorageValue({lastRefresh: Date.now()});
          this.refresh();
        } else {
          console.log(
            `Next refresh Available: ${Math.round(
              (refreshTime - (Date.now() - lastRefresh)) / 1000,
            )} Seconds`,
          );
        }
      }
    }, 1000);
    setTimeout(() => this.setState({cameraDelayLoading: true}), 1);
  }

  componentWillUnmount() {
    this.EventEmitter.removeAllListeners('refresh');
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
    setAsyncStorageValue({usdConversion});
    this.context.setValue({usdConversion});
  }

  async refresh() {
    await this.setStateAsync({refreshing: true});
    try {
      await Promise.all([this.getUSD(), this.getBalance()]);
    } catch (e) {
      console.log(e);
    }
    await this.setStateAsync({refreshing: false});
  }

  async getNativeOrTokenBalance(address, flag) {
    return new Promise(async (resolve) => {
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

  async getBalance() {
    let tokensAddresses = await Promise.all(
      blockchain.tokens.map(token =>
        getAssociatedTokenAddress(
          new PublicKey(token.address),
          new PublicKey(this.context.value.address),
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ),
      ),
    );
    tokensAddresses = tokensAddresses.map(x => x.toBase58());
    const tokenBalances = await Promise.all(
      tokensAddresses.map((addressToken, i) =>
        this.getNativeOrTokenBalance(i === 0 ? this.context.value.address : addressToken, i !== 0),
      ),
    );
    const balances = blockchain.tokens.map((token, i) => {
      return formatUnits(tokenBalances[i], token.decimals);
    });
    setAsyncStorageValue({balances});
    this.context.setValue({balances});
  }

  async createQR() {
    this.setState({
      loading: true,
    });
    const bytes = randomBytes(16);
    const nonce = uuidV4(bytes);
    const user = await getEncryptedStorageValue('user');
    const {res} = await createPayment({
      nonce,
      user,
    });
    if (res === 'BAD REQUEST') {
      await this.setStateAsync({
        loading: false,
      });
      return;
    }
    this.setState({
      loading: false,
      qrData: nonce,
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          this.context.value.address !== '' && (
            <RefreshControl
              progressBackgroundColor={mainColor}
              refreshing={this.state.refreshing}
              onRefresh={async () => {
                await setAsyncStorageValue({
                  lastRefresh: Date.now().toString(),
                });
                await this.refresh();
              }}
            />
          )
        }
        style={[GlobalStyles.scrollContainer]}
        contentContainerStyle={[
          GlobalStyles.scrollContainerContent,
          {
            width: '90%',
            height: 'auto',
            alignSelf: 'center',
            paddingBottom: 20,
          },
        ]}>
        <LinearGradient
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            width: '110%',
            marginTop: 20,
          }}
          colors={['#000000', '#010101', '#1a1a1a', '#010101', '#000000']}>
          <Text style={[GlobalStyles.title]}>FaceID Balance</Text>
          <Text style={[GlobalStyles.balance]}>
            {`$ ${epsilonRound(
              arraySum(
                this.context.value.balances.map(
                  (balance, i) => balance * this.context.value.usdConversion[i],
                ),
              ),
              2,
            )} USD`}
          </Text>
        </LinearGradient>
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'space-around',
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 10,
          }}>
          <Pressable
            disabled={this.state.loading}
            style={[
              GlobalStyles.buttonSelectorSelectedStyle,
              this.state.selector !== 0 && {
                borderColor: '#aaaaaa',
              },
            ]}
            onPress={async () => {
              this.setState({selector: 0});
            }}>
            <Text style={[GlobalStyles.buttonTextSmall]}>Tokens</Text>
          </Pressable>
          <Pressable
            disabled={this.state.loading}
            style={[
              GlobalStyles.buttonSelectorSelectedStyle,
              this.state.selector !== 1 && {
                borderColor: '#aaaaaa',
              },
            ]}
            onPress={async () => {
              this.setState({selector: 1});
            }}>
            <Text style={[GlobalStyles.buttonTextSmall]}>Receive</Text>
          </Pressable>
          <Pressable
            disabled={this.state.loading}
            style={[
              GlobalStyles.buttonSelectorSelectedStyle,
              this.state.selector !== 2 && {
                borderColor: '#aaaaaa',
              },
            ]}
            onPress={async () => {
              this.setState({selector: 2});
            }}>
            <Text style={[GlobalStyles.buttonTextSmall]}>QR Pay</Text>
          </Pressable>
        </View>
        {this.state.selector === 0 && (
          <Fragment>
            {blockchain.tokens.map((token, i) => (
              <View key={`${i}`} style={GlobalStyles.network}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                  }}>
                  <View style={GlobalStyles.networkMarginIcon}>
                    {token.icon}
                  </View>
                  <View style={{justifyContent: 'center'}}>
                    <Text style={GlobalStyles.networkTokenName}>
                      {token.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                      }}>
                      <Text style={GlobalStyles.networkTokenData}>
                        {this.context.value.balances[i] === 0
                          ? '0'
                          : this.context.value.balances[i] < 0.001
                          ? '<0.001'
                          : epsilonRound(
                              this.context.value.balances[i],
                              3,
                            )}{' '}
                        {token.symbol}
                      </Text>
                      <Text style={GlobalStyles.networkTokenData}>
                        {`  -  ($${epsilonRound(
                          this.context.value.usdConversion[i],
                          4,
                        )} USD)`}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{marginHorizontal: 20}}>
                  <Text style={{color: 'white'}}>
                    $
                    {epsilonRound(
                      this.context.value.balances[i] *
                        this.context.value.usdConversion[i],
                      2,
                    )}{' '}
                    USD
                  </Text>
                </View>
              </View>
            ))}
          </Fragment>
        )}
        {this.state.selector === 1 && (
          <Fragment>
            <View
              style={{
                width: '90%',
                height: 'auto',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <QrAddress address={this.context.value.address} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                width: '100%',
                gap: 10,
                paddingBottom: 20,
              }}>
              <Text
                style={{
                  fontSize: normalizeFontSize(20),
                  fontWeight: 'bold',
                  color: 'white',
                  textAlign: 'center',
                  width: '85%',
                }}>
                {this.context.value.address !== '' &&
                  this.context.value.address.substring(
                    0,
                    Math.floor(this.context.value.address.length * (1 / 2)),
                  ) +
                    '\n' +
                    this.context.value.address.substring(
                      this.context.value.address.length * (1 / 2),
                      Math.floor(this.context.value.address.length),
                    )}
              </Text>
              <Pressable
                onPress={() => {
                  Clipboard.setString(this.context.value.address);
                  if (Platform.OS === 'web') {
                    Toast.show({
                      type: 'info',
                      text1: 'Address copied to clipboard',
                      position: 'bottom',
                      visibilityTime: 3000,
                      autoHide: true,
                    });
                  } else {
                    ToastAndroid.show(
                      'Address copied to clipboard',
                      ToastAndroid.LONG,
                    );
                  }
                }}
                style={{
                  width: '15%',
                  alignItems: 'flex-start',
                }}>
                <IconIonicons name="copy" size={30} color={'white'} />
              </Pressable>
            </View>
          </Fragment>
        )}
        {this.state.selector === 2 && (
          <Fragment>
            {this.state.qrData === '' ? (
              <View
                style={{
                  flex: 1,
                  width: '100%',
                  marginVertical: '50%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Pressable
                  disabled={this.state.loading}
                  style={[
                    GlobalStyles.buttonStyle,
                    this.state.loading ? {opacity: 0.5} : {},
                  ]}
                  onPress={() => this.createQR()}>
                  <Text style={[GlobalStyles.buttonText]}>
                    {this.state.loading ? 'Creating...' : 'Create QR Payment'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Fragment>
                <Text style={GlobalStyles.formTitleCard}>Payment QR</Text>
                <View
                  style={{
                    width: '90%',
                    height: 'auto',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <QrAddress address={this.state.qrData} />
                </View>
              </Fragment>
            )}
          </Fragment>
        )}
      </ScrollView>
    );
  }
}

export default Tab1;
