import {useNavigation} from '@react-navigation/native';

export const useHOCS = Component => {
  return props => {
    const navigation = useNavigation();
    return <Component navigation={navigation} {...props} />;
  };
};
