import 'react-native-gesture-handler';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import Tabs from './navigation/Tabs.js';
import { useColorScheme, Platform } from 'react-native'
import mobileAds, { MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';
import { useEffect, useState } from 'react';
import DeviceInfo from 'react-native-device-info'
const appConfig = require('./config.json');
import { AdIdContext } from './context/AdIdContext';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStylingContext } from './context/AppStylingContext';

const EditedLightTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        link: 'blue'
    }
}

const EditedDarkTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        link: 'lightblue'
    }
}

const App = () => {
    const colorScheme = useColorScheme()
    const productionAdId = Platform.OS === 'ios' ? appConfig.ios_ad_id : appConfig.android_ad_id
    const [adId, setAdId] = useState(__DEV__ || DeviceInfo.isEmulatorSync() ? TestIds.BANNER : productionAdId)
    const [appStylingContextState, setAppStylingContextState] = useState(null)

    useEffect(() => {
        mobileAds()
        .setRequestConfiguration({
            // Update all future requests suitable for parental guidance
            maxAdContentRating: MaxAdContentRating.PG,

            // Indicates that you want your content treated as child-directed for purposes of COPPA.
            tagForChildDirectedTreatment: false,

            // Indicates that you want the ad request to be handled in a
            // manner suitable for users under the age of consent.
            tagForUnderAgeOfConsent: true,

            // An array of test device IDs to allow.
            testDeviceIdentifiers: ['EMULATOR'],
        })
        .then(() => {
            console.log('Set ad configuration successfully')
            // Request config successfully set!
            mobileAds()
            .initialize()
            .then(adapterStatuses => {
                // Initialization complete!
                console.log('Ads have successfully been initialized')
            });
        });
    }, [])

    useEffect(() => {
        AsyncStorage.getItem('AppStylingContextState').then(result => {
            if (!result) AsyncStorage.setItem('AppStylingContextState', 'Default')
            setAppStylingContextState(result || 'Default')
        }).catch(error => {
            console.error('An error occurred while getting AppStylingContextState from AsyncStorage:', error)
        })
    }, [])

    const theme = appStylingContextState === 'Default' ? colorScheme === 'dark' ? EditedDarkTheme : EditedLightTheme : appStylingContextState === 'Dark' ? EditedDarkTheme : EditedLightTheme

    return (
        <AdIdContext.Provider value={{adId, setAdId}}>
            <AppStylingContext.Provider value={{appStylingContextState, setAppStylingContextState}}>
                <NavigationContainer theme={theme}>
                    <StatusBar
                        animated={true}
                        barStyle={theme.dark ? 'light-content' : 'dark-content'}
                    />
                    <Tabs/>
                </NavigationContainer>
            </AppStylingContext.Provider>
        </AdIdContext.Provider>
    )
}

export default App;