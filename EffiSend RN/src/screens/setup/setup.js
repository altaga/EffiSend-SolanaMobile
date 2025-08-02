import {useNavigation} from '@react-navigation/native';
import {randomBytes, uuidV4} from 'ethers';
import {useCallback, useContext, useEffect, useState} from 'react';
import {Pressable, ScrollView, Text, View, SafeAreaView} from 'react-native';
import {Toast} from 'toastify-react-native';
import {createOrFetchFace} from '../../api/createOrFetchFace';
import {createOrFetchWallet} from '../../api/createOrFetchWallet';
import CamFace from '../../components/camFace';
import {useStateAsync} from '../../core/useAsyncState';
import {setAsyncStorageValue, setEncryptedStorageValue} from '../../core/utils';
import ContextModule from '../../providers/contextModule';
import GlobalStyles, {mainColor, secondaryColor} from '../../styles/styles';

export default function Setup() {
  const [loading, setLoading] = useState(false);
  const [take, setTake] = useStateAsync(false);
  const navigation = useNavigation();
  const context = useContext(ContextModule);

  const createWallet = useCallback(async image => {
    try {
      setLoading(true);
      const bytes = randomBytes(16);
      const nonce = `face_${uuidV4(bytes)}`;
      const {result: faceResult} = await createOrFetchFace({image, nonce});
      console.log(faceResult);
      if (faceResult === null) {
        setLoading(false);
      } else {
        if (typeof faceResult === 'string') {
          const {result: walletResult} = await createOrFetchWallet({
            user: faceResult,
          });
          console.log(walletResult);
          if (walletResult !== null) {
            const {user, address} = walletResult;
            await setEncryptedStorageValue({user});
            await setAsyncStorageValue({address});
            await context.setValueAsync({
              address,
            });
            navigation.navigate('Main');
          }
        } else if (typeof faceResult === 'boolean' && faceResult === true) {
          const {result: walletResult} = await createOrFetchWallet({
            nonce: faceResult,
          });
          console.log(walletResult);
          if (walletResult !== null) {
            const {user, address} = walletResult;
            await setEncryptedStorageValue({user});
            await setAsyncStorageValue({address});
            await context.setValueAsync({
              address,
            });
            navigation.navigate('Main');
            Toast.show({
              type: 'info',
              text1: 'You have won BONK tokens because you verified',
              text2: 'Go to the Effisend ID tab to claim',
              position: 'bottom',
              visibilityTime: 10000,
              autoHide: true,
            });
          }
        }
      }
      setLoading(false);
    } catch (e) {
      console.log(e);
    }
  }, []);

  return (
    <SafeAreaView style={[GlobalStyles.container]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={GlobalStyles.scrollContainer}
        contentContainerStyle={[GlobalStyles.scrollContainerContent]}>
        <View>
          <Text style={GlobalStyles.title}>FaceID</Text>
        </View>
        <View
          style={{
            height: 'auto',
            width: '90%',
            borderColor: loading ? mainColor : secondaryColor,
            borderWidth: 5,
            borderRadius: 10,
            aspectRatio: 1,
          }}>
          <CamFace
            facing={'front'}
            take={take}
            onImage={image => {
              createWallet(image);
            }}
          />
        </View>
        <Pressable
          disabled={loading}
          style={[
            GlobalStyles.buttonStyle,
            {width: '90%'},
            loading ? {opacity: 0.5} : {},
          ]}
          onPress={async () => {
            await setTake(true);
            await setTake(false);
          }}>
          <Text style={[GlobalStyles.buttonText]}>
            {loading ? 'Fetching...' : 'Join / Recover'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
