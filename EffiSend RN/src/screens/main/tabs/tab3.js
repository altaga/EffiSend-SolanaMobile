import Ionicons from 'react-native-vector-icons/Ionicons';
import {address} from '@solana/kit';
import LinearGradient from 'react-native-linear-gradient';
import React, {Fragment, useCallback, useEffect} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {claimRewards} from '../../../api/claimRewards';
import {blockchain} from '../../../core/constants';
import {setAsyncStorageValue, setupProvider} from '../../../core/utils';
import ContextModule from '../../../providers/contextModule';
import GlobalStyles from '../../../styles/styles';
import {getAllocatedRewards} from '../../../api/getAllocatedRewards';

function generateColors(base58, count = 3) {
  if (!base58 || base58.trim() === '') {
    return Array(count).fill('#FFFFFF');
  }

  const base58Alphabet =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let numericValue = 0;

  for (let i = 0; i < base58.length; i++) {
    const charIndex = base58Alphabet.indexOf(base58[i]);
    numericValue = numericValue * 58 + (charIndex >= 0 ? charIndex : 0);
  }

  // Convert numeric value to hex and pad it
  const hex = numericValue.toString(16).padStart(6, '0').slice(0, 6);

  const colors = [];

  for (let i = 0; i < count; i++) {
    const offset = i * 2;

    const rRaw = parseInt(
      hex.slice((offset + 0) % 6, (offset + 2) % 6 || 6),
      16,
    );
    const gRaw = parseInt(
      hex.slice((offset + 2) % 6, (offset + 4) % 6 || 6),
      16,
    );
    const bRaw = parseInt(
      hex.slice((offset + 4) % 6, (offset + 6) % 6 || 6),
      16,
    );

    // Soft color range (pastel-ish)
    const r = Math.floor(127 + (rRaw / 255) * 128);
    const g = Math.floor(127 + (gRaw / 255) * 128);
    const b = Math.floor(127 + (bRaw / 255) * 128);

    const color = `#${[r, g, b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')}`;
    colors.push(color.toUpperCase());
  }

  return colors;
}

export default function Tab3() {
  const context = React.useContext(ContextModule);
  const [loading, setLoading] = React.useState(true);
  const [starter, setStarter] = React.useState(false);
  const provider = setupProvider(blockchain.rpcs);

  const getAllocatedRewardsFunc = useCallback(async () => {
    setLoading(true);
    const {
      result: {rewards},
    } = await getAllocatedRewards({address: context.value.address});
    const nonces = await provider
      .getSignaturesForAddress(address(context.value.address))
      .send();

    if (nonces.length > 100) {
      await context.setValueAsync({trustScore: 100});
      await setAsyncStorageValue({trustScore: 100});
    } else {
      console.log(nonces.length);
      await context.setValueAsync({trustScore: nonces.length});
      await setAsyncStorageValue({trustScore: nonces.length});
    }
    await context.setValueAsync({rewardPoints: Number(rewards)});
    await setAsyncStorageValue({rewardPoints: Number(rewards)});
    setLoading(false);
  }, [context]);

  useEffect(() => {
    async function getStarter() {
      await getAllocatedRewardsFunc();
      setStarter(true);
    }
    getStarter();
  }, []);

  const handleRewardPoints = async () => {
    setLoading(true);
    await claimRewards({address: context.value.address});
    await getAllocatedRewardsFunc();
    setLoading(false);
  };

  return (
    <Fragment>
      <View style={GlobalStyles.main}>
        <ScrollView
          style={[GlobalStyles.content, {width: '100%'}]}
          contentContainerStyle={{
            justifyContent: 'space-between',
            alignItems: 'center',
            alignSelf: 'center',
            height: 'auto',
            width: '80%',
          }}
          showsVerticalScrollIndicator={false}>
          <View style={GlobalStyles.profileSection}>
            <View style={GlobalStyles.avatarContainer}>
              <LinearGradient
                colors={generateColors(context.value.address)}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={GlobalStyles.avatarGradient}
              />
            </View>
            <Text style={GlobalStyles.username}>
              {context.value.address !== ''
                ? `@EffiUser_${context.value.address.substring(0, 6)}`
                : 'Not Connected'}
            </Text>
            <Text style={GlobalStyles.joinDate}>
              {context.value.address !== ''
                ? `Joined, ${new Date().getDate()} ${new Date().toLocaleString(
                    'default',
                    {
                      month: 'long',
                    },
                  )} ${new Date().getFullYear()}`
                : 'Not Joined'}
            </Text>
          </View>
          <View style={GlobalStyles.verificationSection}>
            <View style={GlobalStyles.verificationBadge}>
              <Ionicons name="checkmark" size={20} color="#ffffff" />
            </View>
            <View style={GlobalStyles.verificationText}>
              <Text style={GlobalStyles.verificationLabel}>Identity</Text>
              <Text style={GlobalStyles.verificationStatus}>
                {context.value.address !== '' ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Ionicons name="star" size={24} color="#ffaa00" />
              <Text style={styles.scoreTitle}>Trust Score</Text>
            </View>
            <Text style={styles.scoreValue}>
              {context.value.trustScore}/100
            </Text>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreProgress,
                  {width: `${context.value.trustScore}%`},
                ]}
              />
            </View>
          </View>
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Ionicons name="gift" size={24} color="#8B5CF6" />
              <Text style={styles.scoreTitle}>Pending Reward Points</Text>
            </View>
            <Text style={styles.rewardsValue}>
              {context.value.rewardPoints}
            </Text>
            <TouchableOpacity
              style={[
                styles.claimButton,
                {opacity: context.value.rewardPoints > 0 && !loading ? 1 : 0.5},
              ]}
              onPress={() => handleRewardPoints()}
              disabled={context.value.rewardPoints <= 0 || loading}>
              <Text style={styles.claimButtonText}>
                {!starter
                  ? 'Loading...'
                  : loading
                  ? 'Claiming...'
                  : 'Claim Rewards for Verification'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{width: '90%', marginTop: 30}}>
            <Text style={[styles.sectionTitle, {alignItems: 'flex-start'}]}>
              Verification Benefits
            </Text>
          </View>

          <View style={[styles.scoreCard, {marginTop: 0, marginBottom: 10}]}>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="trending-up" size={20} color="#10B981" />
                <Text style={styles.benefitText}>
                  Lower transaction fees for verified users
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="gift" size={20} color="#8B5CF6" />
                <Text style={styles.benefitText}>
                  Earn BONK rewards for maintaining verification
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="shield" size={20} color="#3B82F6" />
                <Text style={styles.benefitText}>
                  Access to premium EffiSend features
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.benefitText}>
                  Higher trust score in the network
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statusCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusLevel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: '#1a1a1a',
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffaa00',
    marginBottom: 12,
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    backgroundColor: '#ffaa00',
    borderRadius: 4,
  },
  rewardsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  rewardsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 12,
  },
  claimButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  actionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  benefitsSection: {
    marginBottom: 32,
    width: '90%',
  },
  benefitsList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
