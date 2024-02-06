import { SafeAreaView, ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import SettingRow from "../components/SettingRow";
import AppCredits from "../components/AppCredits";

const SettingsScreen = ({navigation}) => {
    const {colors} = useTheme();

    return (
        <SafeAreaView>
            <ScrollView style={{height: '100%'}}>
                <SettingRow settingName="Notifications" navigation={navigation} navigateTo="NotificationsSettings"/>
                <SettingRow settingName="App Styling" navigation={navigation} navigateTo="AppStylingSettings"/>
                <SettingRow settingName="Gallery Password" navigation={navigation} navigateTo="GalleryPasswordSettings"/>
                <AppCredits/>
            </ScrollView>
        </SafeAreaView>
    )
}

export default SettingsScreen;