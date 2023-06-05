import { useContext } from "react";
import { AdIdContext } from "../context/AdIdContext";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import {View} from 'react-native';

const Ad = () => {
    const {adId} = useContext(AdIdContext);

    return (
        <View style={{width: '100%', height: 300, justifyContent: 'center', alignItems: 'center'}}>
            <BannerAd
                unitId={adId}
                size={BannerAdSize.MEDIUM_RECTANGLE}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
            />
        </View>
    )
}

export default Ad;