import { useTheme } from "@react-navigation/native"
import { Switch, View, Text } from "react-native";

const ToggleOption = ({value, onValueChange, sideText}) => {
    const {colors} = useTheme();

    return (
        <View style={{justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', padding: 10}}>
            <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.text}}>{sideText}</Text>
            <Switch
                trackColor={{false: colors.background, true: colors.link}}
                thumbColor={value ? 'white' : colors.text}
                ios_backgroundColor={colors.background}
                onValueChange={onValueChange}
                value={value}
            />
        </View>
    )
}

export default ToggleOption;