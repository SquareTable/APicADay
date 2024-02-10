import { View, Text } from "react-native";
import { useTheme } from "@react-navigation/native";

const AppCredits = () => {
    const {colors} = useTheme();
    return (
        <View style={{marginTop: 20}}>
            <Text style={{color: colors.text, fontSize: 20, textAlign: 'center'}}>Copyright © SquareTable</Text>
            <Text style={{color: colors.text, fontSize: 20, textAlign: 'center'}}>2023 - present</Text>
            <Text style={{color: colors.text, fontSize: 20, textAlign: 'center'}}>All Rights Reserved</Text>
        </View>
    )
}

export default AppCredits;