import { Component, useContext } from "react";
import { View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { AdIdContext } from '../context/AdIdContext';

class AppBannerAdClass extends Component {
    constructor(props) {
        super(props)

        this.state = {
            error: false
        }
    }

    static getDerivedStateFromError(error) {
        console.error(error)

        return {
            error: true
        }
    }

    render() {
        if (this.state.error) return (
            <View style={{height: 250, width: 300, borderColor: 'red', borderWidth: 1, borderStyle: 'dashed', marginVertical: 10}}/>
        )

        return (
            <BannerAd
                unitId={this.props.adId}
                size={BannerAdSize.MEDIUM_RECTANGLE}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdFailedToLoad={(error) => {
                    console.warn('An error occurred while loading ad:', error)
                    this.setState({
                        error: true
                    })
                }}
            />
        )
    }
}

function Ad() {
    const {adId} = useContext(AdIdContext);

    return <AppBannerAdClass adId={adId}/>
}

export default Ad;