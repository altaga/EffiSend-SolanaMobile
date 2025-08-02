import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useState} from 'react';
import {Image, Pressable, SafeAreaView, Text, View} from 'react-native';
import AgentB from '../../assets/images/agentB.png';
import AgentW from '../../assets/images/agentW.png';
import Header from '../../components/header';
import GlobalStyles, {iconSize, mainColor} from '../../styles/styles';
import Tab1 from './tabs/tab1';
import Tab2 from './tabs/tab2';
import Tab3 from './tabs/tab3';
import Tab4 from './tabs/tab4';
import {useNavigation} from '@react-navigation/native';

// Base state
const BaseStateMain = {
  tab: 0, // 0
};

export default function MainComponent() {
  const [tab, setTab] = useState(BaseStateMain.tab);
  const navigation = useNavigation();

  const handleTabPress = tabIndex => {
    setTab(tabIndex);
  };

  return (
    <SafeAreaView style={[GlobalStyles.container]}>
      <Header />
      <View style={[GlobalStyles.main]}>
        {tab === 0 && <Tab1 navigation={navigation} />}
        {tab === 1 && <Tab2 navigation={navigation} />}
        {tab === 2 && <Tab3 />}
        {
          tab === 3 && <Tab4 />
        }
      </View>
      <View style={[GlobalStyles.footer]}>
        <Pressable
          style={GlobalStyles.selector}
          onPress={() => handleTabPress(0)}>
          <MaterialIcons
            name="account-balance-wallet"
            size={iconSize}
            color={tab === 0 ? mainColor : 'white'}
          />
          <Text
            style={
              tab === 0
                ? GlobalStyles.selectorSelectedText
                : GlobalStyles.selectorText
            }>
            Home
          </Text>
        </Pressable>

        <Pressable
          style={GlobalStyles.selector}
          onPress={() => handleTabPress(1)}>
          <FontAwesome5
            name="money-bill-wave"
            size={iconSize}
            color={tab === 1 ? mainColor : 'white'}
          />
          <Text
            style={
              tab === 1
                ? GlobalStyles.selectorSelectedText
                : GlobalStyles.selectorText
            }>
            Charge
          </Text>
        </Pressable>
        <Pressable
          style={GlobalStyles.selector}
          onPress={() => handleTabPress(2)}>
          <FontAwesome5
            name="id-badge"
            size={iconSize}
            color={tab === 2 ? mainColor : 'white'}
          />
          <Text
            style={
              tab === 2
                ? GlobalStyles.selectorSelectedText
                : GlobalStyles.selectorText
            }>
            EffiSend ID
          </Text>
        </Pressable>
        <Pressable
          style={GlobalStyles.selector}
          onPress={() => handleTabPress(3)}>
          <Image
            source={tab === 3 ? AgentB : AgentW}
            style={{width: iconSize, height: iconSize, borderRadius: 10}}
          />
          <Text
            style={
              tab === 3
                ? GlobalStyles.selectorSelectedText
                : GlobalStyles.selectorText
            }>
            Agent
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
