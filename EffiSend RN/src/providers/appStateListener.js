import React, {Component, Fragment} from 'react';
import {AppState} from 'react-native';
import ContextModule from './contextModule';
import {useHOCS} from '../hocs/useHOCS';

class AppStateListener extends Component {
  constructor(props) {
    super(props);
    this.listener = null;
  }

  static contextType = ContextModule;

  componentDidMount() {
    this.listener = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
  }

  componentWillUnmount() {
    this.listener.remove();
  }

  handleAppStateChange = nextAppState => {
    console.log('nextAppState', nextAppState);
    if (nextAppState === 'background') {
    }
    if (nextAppState === 'active') {
    }
  };

  render() {
    return <Fragment />;
  }
}

export default useHOCS(AppStateListener);
