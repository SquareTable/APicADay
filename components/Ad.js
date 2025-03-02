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
        if (this.state.error) return null

        return (
            <View style={{width: '100%', justifyContent: 'center', alignItems: 'center'}}>
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
            </View>
        )
    }
}

function Ad() {
    const {adId} = useContext(AdIdContext);

    return <AppBannerAdClass adId={adId}/>
}

export default Ad;