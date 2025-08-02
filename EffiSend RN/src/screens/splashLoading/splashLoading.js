// Basic Imports
import {useNavigation, useRoute} from '@react-navigation/native';
import React, {useContext, useEffect} from 'react';
import {Image, View} from 'react-native';
import logoSplash from '../../assets/images/splash-iconC.png';
import {getAsyncStorageValue} from '../../core/utils';
import ContextModule from '../../providers/contextModule';
import GlobalStyles from '../../styles/styles';

const SplashLoading = () => {
  const context = useContext(ContextModule);
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const focusListener = navigation.addListener('focus', async () => {
      console.log(route.name);
      const address = await getAsyncStorageValue('address');
      if (address) {
        const balances = await getAsyncStorageValue('balances');
        const usdConversion = await getAsyncStorageValue('usdConversion');
        const trustScore = await getAsyncStorageValue('trustScore');
        const rewardPoints = await getAsyncStorageValue('rewardPoints');
        await context.setValueAsync({
          address: address ?? context.value.address,
          balances: balances ?? context.value.balances,
          usdConversion: usdConversion ?? context.value.usdConversion,
          trustScore: trustScore ?? context.value.trustScore,
          rewardPoints: rewardPoints ?? context.value.rewardPoints,
        });
        navigation.navigate('Main');
      } else {
        navigation.navigate('Setup');
      }
    });

    const blurListener = navigation.addListener('blur', () => {});
    return () => {
      focusListener();
      blurListener();
    };
  }, []);

  return (
    <View style={[GlobalStyles.container, {justifyContent: 'center'}]}>
      <Image
        resizeMode="contain"
        source={logoSplash}
        alt="Main Logo"
        style={{
          width: '70%',
        }}
      />
    </View>
  );
};

export default SplashLoading;
