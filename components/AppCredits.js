import { View, Text } from "react-native";
import { useTheme } from "@react-navigation/native";

const AppCredits = () => {
    const {colors} = useTheme();
    return (
        <View style={{marginTop: 20}}>
            <Text style={{color: colors.text, fontSize: 24, textAlign: 'center'}}>© SquareTable 2023</Text>
            <Text style={{color: colors.text, fontSize: 24, textAlign: 'center'}}>All Rights Reserved</Text>
        </View>
    )
}

export default AppCredits;